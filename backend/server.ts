import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { mkdirSync } from "fs";
import multer from "multer";
import path from "path";
import type { Prisma } from "@prisma/client";
import { createSessionToken, sessionCookieName, type SessionUser, verifySessionToken } from "../lib/auth/token";
import { canUseDatabase, prisma } from "../lib/prisma";
import { demoComments, demoPosts, demoProducts, demoStories, demoUsers } from "../lib/demo-data";
import {
  accountSettingsSchema,
  cartQuantitySchema,
  categoryCreateSchema,
  commentSchema,
  loginSchema,
  orderSchema,
  orderStatusSchema,
  passwordChangeSchema,
  productBatchSchema,
  productCreateSchema,
  signupSchema,
} from "../lib/validation/schemas";
import type { CartLine, CategoryItem, DemoUser, FeedPost, OrderDetail, OrderSummary, Product, Story } from "../lib/types";

const app = express();
const port = Number(process.env.BACKEND_PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";
const productUploadDir = path.join(process.cwd(), "public", "uploads", "products");
const profileUploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
mkdirSync(productUploadDir, { recursive: true });
mkdirSync(profileUploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: productUploadDir,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname);
      const baseName = path
        .basename(file.originalname, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      callback(null, `${Date.now()}-${crypto.randomUUID()}-${baseName || "media"}${extension}`);
    },
  }),
  limits: {
    files: 8,
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) callback(null, true);
    else callback(new Error("Only image and video files are allowed."));
  },
});
const profileUpload = multer({
  storage: multer.diskStorage({
    destination: profileUploadDir,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname);
      const baseName = path
        .basename(file.originalname, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      callback(null, `${Date.now()}-${crypto.randomUUID()}-${baseName || "avatar"}${extension}`);
    },
  }),
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) callback(null, true);
    else callback(new Error("Only image files are allowed."));
  },
});

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    vendor: true;
  };
}>;

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    creator: true;
    product: {
      include: {
        category: true;
        vendor: true;
      };
    };
  };
}>;

type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: {
        products: true;
      };
    };
  };
}>;

type OrderRecord = Prisma.OrderGetPayload<Record<string, never>>;

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

function requestId() {
  return crypto.randomUUID();
}

function success<T>(res: Response, data: T, startedAt: number, init?: { status?: number; cache?: "hit" | "miss" | "demo"; page?: unknown }) {
  return res.status(init?.status ?? 200).json({
    success: true,
    data,
    error: null,
    meta: {
      requestId: requestId(),
      timingMs: Date.now() - startedAt,
      cache: init?.cache,
      page: init?.page,
    },
  });
}

function failure(res: Response, code: string, message: string, startedAt: number, status = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message },
    meta: {
      requestId: requestId(),
      timingMs: Date.now() - startedAt,
    },
  });
}

function mapUser(user: {
  id: string;
  name: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: DemoUser["role"];
}): DemoUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email ?? undefined,
    avatarUrl: user.avatarUrl ?? "",
    bio: user.bio ?? undefined,
    role: user.role,
  };
}

function mapSessionUser(user: {
  id: string;
  name: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  role: SessionUser["role"];
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email ?? undefined,
    avatarUrl: user.avatarUrl ?? "",
    role: user.role,
  };
}

function mapProduct(product: ProductWithRelations): Product {
  return {
    id: product.id,
    vendorId: product.vendorId,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    images: product.images,
    media: product.media?.map((media) => ({
      url: media.url,
      type: media.type === "video" ? "video" : "image",
      fileName: media.fileName ?? undefined,
      order: media.order,
      isPrimary: media.isPrimary,
    })),
    category: product.category?.name ?? "Uncategorized",
    price: product.price,
    originalPrice: product.originalPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
    stockQuantity: product.stockQuantity,
    sku: product.sku ?? "",
    status: product.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "ACTIVE",
    tags: product.tags,
    vendorName: product.vendor.username,
  };
}

function mapPost(post: PostWithRelations): FeedPost {
  return {
    id: post.id,
    slug: post.slug,
    creator: mapUser(post.creator),
    caption: post.caption,
    hashtags: post.hashtags,
    media: post.media.map((media) => ({
      url: media.url,
      type: "image",
      width: media.width ?? 0,
      height: media.height ?? 0,
    })),
    product: post.product ? mapProduct(post.product) : undefined,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
  };
}

function mapProductToFeedPost(product: ProductWithRelations): FeedPost {
  const mappedProduct = mapProduct(product);
  const media = mappedProduct.media?.length
    ? [...mappedProduct.media]
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order)
        .map((item) => ({
          url: item.url,
          type: item.type,
          width: 0,
          height: 0,
        }))
    : mappedProduct.images.map((url) => ({
        url,
        type: "image" as const,
        width: 0,
        height: 0,
      }));

  return {
    id: `product-${product.id}`,
    slug: product.slug,
    creator: mapUser(product.vendor),
    caption: product.shortDescription || product.description || product.name,
    hashtags: [],
    media,
    product: mappedProduct,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
  };
}

function mapCategory(category: CategoryWithCount): CategoryItem {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId ?? undefined,
    imageUrl: category.imageUrl ?? undefined,
    productCount: category._count.products,
    createdAt: category.createdAt.toISOString(),
  };
}

function mapOrderSummary(order: OrderRecord): OrderSummary {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotal: order.subtotal,
    shippingAmount: order.shippingAmount,
    discountAmount: order.discountAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    customerName: order.shippingAddress.fullName,
    createdAt: order.createdAt.toISOString(),
  };
}

function mapOrderDetail(order: OrderRecord): OrderDetail {
  return {
    ...mapOrderSummary(order),
    shippingAddress: {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      addressLine: order.shippingAddress.addressLine,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state ?? undefined,
      country: order.shippingAddress.country,
      postalCode: order.shippingAddress.postalCode ?? undefined,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      vendorId: item.vendorId,
      name: item.name,
      imageUrl: item.imageUrl ?? undefined,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    })),
  };
}

async function getCartLines(userId: string): Promise<CartLine[]> {
  const cartItems = await prisma.cartItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const productIds = cartItems.map((item) => item.productId);
  if (!productIds.length) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true, vendor: true },
  });
  const productsById = new Map(products.map((product) => [product.id, mapProduct(product)]));

  return cartItems.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
}

async function getSession(req: Request) {
  const token = req.cookies?.[sessionCookieName];
  return token ? verifySessionToken(token) : null;
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
}

async function requireSession(req: Request, res: Response, startedAt: number, message: string): Promise<SessionUser | null> {
  const user = await getSession(req);
  if (!user) {
    failure(res, "UNAUTHORIZED", message, startedAt, 401);
    return null;
  }

  return user;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireProductManager(req: Request, res: Response, startedAt: number) {
  const user = await requireSession(req, res, startedAt, "Login is required to manage products.");
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "VENDOR") {
    failure(res, "FORBIDDEN", "Only admin and vendor users can manage products.", startedAt, 403);
    return null;
  }

  return user;
}

async function requireProductAccess(productId: string, req: Request, res: Response, startedAt: number) {
  const user = await requireProductManager(req, res, startedAt);
  if (!user) return null;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
    return null;
  }
  if (user.role !== "ADMIN" && product.vendorId !== user.id) {
    failure(res, "FORBIDDEN", "You can only manage your own products.", startedAt, 403);
    return null;
  }

  return { user, product };
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

async function getDatabasePosts(limit = 10) {
  if (!canUseDatabase()) return null;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      category: true,
      vendor: true,
    },
  });

  return products.map(mapProductToFeedPost);
}

function getStoriesFromPosts(posts: FeedPost[]): Story[] {
  return posts
    .filter((post) => post.media[0])
    .map((post) => ({
      id: `story-${post.id}`,
      creator: post.creator,
      mediaUrl: post.media[0]?.url ?? "",
      viewed: false,
      product: post.product,
    }));
}

async function getDatabaseProducts(query = "") {
  if (!canUseDatabase()) return null;

  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      vendor: true,
    },
  });

  return products.map(mapProduct);
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/v1/auth/signup", async (req, res) => {
  const startedAt = Date.now();
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter a valid name, username, email, and password.", startedAt, 422);

  const { name, username, email, password } = parsed.data;

  if (canUseDatabase()) {
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existingUser) return failure(res, "USER_EXISTS", "Email or username is already registered.", startedAt, 409);

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "CUSTOMER";
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: await bcrypt.hash(password, 12),
        avatarUrl: null,
        role,
      },
      select: { id: true, name: true, username: true, email: true, avatarUrl: true, role: true },
    });
    const sessionUser = { ...user, avatarUrl: user.avatarUrl ?? "", email: user.email ?? undefined };
    setSessionCookie(res, await createSessionToken(sessionUser));
    return success(res, { user: sessionUser }, startedAt);
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    avatarUrl: "",
    role: "CUSTOMER" as const,
  };
  setSessionCookie(res, await createSessionToken(user));
  return success(res, { user }, startedAt, { cache: "demo" });
});

app.post("/api/v1/auth/login", async (req, res) => {
  const startedAt = Date.now();
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter a valid email and password.", startedAt, 422);

  const { email, password } = parsed.data;

  if (canUseDatabase()) {
    const user = await prisma.user.findUnique({ where: { email } });
    const validPassword = user?.password ? await bcrypt.compare(password, user.password) : false;
    if (!user || !validPassword) return failure(res, "INVALID_CREDENTIALS", "Invalid email or password.", startedAt, 401);

    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? "",
      role: user.role,
    };
    setSessionCookie(res, await createSessionToken(sessionUser));
    return success(res, { user: sessionUser }, startedAt);
  }

  if (email !== "demo@example.com" || password !== "password123") {
    return failure(res, "INVALID_CREDENTIALS", "Use demo@example.com with password123, or create an account.", startedAt, 401);
  }

  const demoUser = demoUsers[5];
  setSessionCookie(res, await createSessionToken(demoUser));
  return success(res, { user: demoUser }, startedAt, { cache: "demo" });
});

app.post("/api/v1/auth/logout", (_req, res) => {
  const startedAt = Date.now();
  res.clearCookie(sessionCookieName, { path: "/" });
  return success(res, { ok: true }, startedAt);
});

app.get("/api/v1/auth/me", async (req, res) => {
  const startedAt = Date.now();
  const user = await getSession(req);
  return success(res, { user }, startedAt);
});

app.get("/api/v1/account/settings", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view settings.");
  if (!user) return;

  if (!canUseDatabase()) {
    return success(
      res,
      {
        user: {
          ...user,
          phone: "",
          bio: "",
        },
      },
      startedAt,
      { cache: "demo" },
    );
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, username: true, email: true, phone: true, avatarUrl: true, bio: true, role: true },
  });
  if (!account) return failure(res, "NOT_FOUND", "Account was not found.", startedAt, 404);

  return success(
    res,
    {
      user: {
        ...mapSessionUser(account),
        phone: account.phone ?? "",
        bio: account.bio ?? "",
      },
    },
    startedAt,
  );
});

app.patch("/api/v1/account/settings", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update settings.");
  if (!user) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update account settings.", startedAt, 503);
  }

  const parsed = accountSettingsSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter valid account details.", startedAt, 422);

  const input = parsed.data;
  const existing = await prisma.user.findFirst({
    where: {
      id: { not: user.id },
      OR: [
        { username: input.username },
        { email: input.email },
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
    select: { username: true, email: true, phone: true },
  });
  if (existing?.username === input.username) return failure(res, "USERNAME_EXISTS", "Username is already in use.", startedAt, 409);
  if (existing?.email === input.email) return failure(res, "EMAIL_EXISTS", "Email is already in use.", startedAt, 409);
  if (input.phone && existing?.phone === input.phone) return failure(res, "PHONE_EXISTS", "Phone number is already in use.", startedAt, 409);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name,
      username: input.username,
      email: input.email,
      phone: input.phone || null,
      bio: input.bio || null,
    },
    select: { id: true, name: true, username: true, email: true, phone: true, avatarUrl: true, bio: true, role: true },
  });
  const sessionUser = mapSessionUser(updated);
  setSessionCookie(res, await createSessionToken(sessionUser));

  return success(
    res,
    {
      user: {
        ...sessionUser,
        phone: updated.phone ?? "",
        bio: updated.bio ?? "",
      },
    },
    startedAt,
  );
});

app.post("/api/v1/account/avatar", profileUpload.single("avatar"), async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to upload an avatar.");
  if (!user) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to upload profile images.", startedAt, 503);
  }

  const file = req.file as Express.Multer.File | undefined;
  if (!file) return failure(res, "VALIDATION_ERROR", "Choose an image file to upload.", startedAt, 422);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: `/uploads/profiles/${file.filename}` },
    select: { id: true, name: true, username: true, email: true, phone: true, avatarUrl: true, bio: true, role: true },
  });
  const sessionUser = mapSessionUser(updated);
  setSessionCookie(res, await createSessionToken(sessionUser));

  return success(
    res,
    {
      user: {
        ...sessionUser,
        phone: updated.phone ?? "",
        bio: updated.bio ?? "",
      },
    },
    startedAt,
    { status: 201 },
  );
});

app.patch("/api/v1/account/password", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update password.");
  if (!user) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update password.", startedAt, 503);
  }

  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter valid password details.", startedAt, 422);

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });
  if (!account) return failure(res, "NOT_FOUND", "Account was not found.", startedAt, 404);
  if (!account.password) return failure(res, "PASSWORD_UNSUPPORTED", "This account does not have a password to change.", startedAt, 409);

  const validPassword = await bcrypt.compare(parsed.data.currentPassword, account.password);
  if (!validPassword) return failure(res, "INVALID_PASSWORD", "Current password is incorrect.", startedAt, 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  return success(res, { ok: true }, startedAt);
});

app.get("/api/v1/posts", async (req, res) => {
  const startedAt = Date.now();
  const limit = Math.min(Number(req.query.limit ?? 10), 20);
  const databasePosts = await getDatabasePosts(limit);
  if (databasePosts) return success(res, { items: databasePosts, nextCursor: null }, startedAt);

  return success(res, { items: demoPosts.slice(0, limit), nextCursor: null }, startedAt, { cache: "demo" });
});

app.get("/api/v1/posts/slug/:slug", async (req, res) => {
  const startedAt = Date.now();
  if (canUseDatabase()) {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        vendor: true,
      },
    });
    if (!product) return failure(res, "NOT_FOUND", "Post was not found.", startedAt, 404);
    return success(res, mapProductToFeedPost(product), startedAt);
  }

  const product = demoProducts.find((item) => item.slug === req.params.slug);
  if (!product) return failure(res, "NOT_FOUND", "Post was not found.", startedAt, 404);
  return success(
    res,
    {
      id: `product-${product.id}`,
      slug: product.slug,
      creator: demoUsers.find((user) => user.id === product.vendorId) ?? demoUsers[0],
      caption: product.shortDescription || product.description || product.name,
      hashtags: [],
      media: product.images.map((url) => ({ url, type: "image", width: 0, height: 0 })),
      product,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
    },
    startedAt,
    { cache: "demo" },
  );
});

app.get("/api/v1/stories", async (_req, res) => {
  const startedAt = Date.now();
  const databasePosts = await getDatabasePosts();
  if (databasePosts) return success(res, { items: getStoriesFromPosts(databasePosts) }, startedAt);

  return success(res, { items: demoStories }, startedAt, { cache: "demo" });
});

app.get("/api/v1/profiles/:username", async (req, res) => {
  const startedAt = Date.now();
  const username = getRouteParam(req.params.username);
  const viewer = await getSession(req);

  if (canUseDatabase()) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, name: true, username: true, email: true, avatarUrl: true, bio: true, role: true },
    });
    if (!user) return failure(res, "NOT_FOUND", "Profile was not found.", startedAt, 404);

    const [posts, products, followers, following, viewerFollow] = await Promise.all([
      prisma.post.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          creator: true,
          product: {
            include: {
              category: true,
              vendor: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { vendorId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          vendor: true,
        },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      viewer && viewer.id !== user.id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: user.id,
              },
            },
          })
        : Promise.resolve(null),
    ]);

    return success(
      res,
      {
        user: mapUser(user),
        stats: {
          posts: posts.length,
          products: products.length,
          followers,
          following,
        },
        isFollowing: Boolean(viewerFollow),
        posts: posts.map(mapPost),
        products: products.map(mapProduct),
      },
      startedAt,
    );
  }

  const user = demoUsers.find((item) => item.username === username);
  if (!user) return failure(res, "NOT_FOUND", "Profile was not found.", startedAt, 404);

  const posts = demoPosts.filter((post) => post.creator.id === user.id || post.creator.username === user.username);
  const products = demoProducts.filter((product) => product.vendorId === user.id);

  return success(
    res,
    {
      user,
      stats: {
        posts: posts.length,
        products: products.length,
        followers: 0,
        following: 0,
      },
      isFollowing: false,
      posts,
      products,
    },
    startedAt,
    { cache: "demo" },
  );
});

app.post("/api/v1/profiles/:username/follow", async (req, res) => {
  const startedAt = Date.now();
  const viewer = await requireSession(req, res, startedAt, "Login is required to follow profiles.");
  if (!viewer) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to follow profiles.", startedAt, 503);
  }

  const username = getRouteParam(req.params.username);
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return failure(res, "NOT_FOUND", "Profile was not found.", startedAt, 404);
  if (target.id === viewer.id) return failure(res, "SELF_FOLLOW", "You cannot follow your own profile.", startedAt, 409);

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewer.id,
        followingId: target.id,
      },
    },
    update: {},
    create: {
      followerId: viewer.id,
      followingId: target.id,
    },
  });

  const followers = await prisma.follow.count({ where: { followingId: target.id } });
  return success(res, { isFollowing: true, followers }, startedAt);
});

app.delete("/api/v1/profiles/:username/follow", async (req, res) => {
  const startedAt = Date.now();
  const viewer = await requireSession(req, res, startedAt, "Login is required to unfollow profiles.");
  if (!viewer) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to unfollow profiles.", startedAt, 503);
  }

  const username = getRouteParam(req.params.username);
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return failure(res, "NOT_FOUND", "Profile was not found.", startedAt, 404);

  await prisma.follow.deleteMany({
    where: {
      followerId: viewer.id,
      followingId: target.id,
    },
  });

  const followers = await prisma.follow.count({ where: { followingId: target.id } });
  return success(res, { isFollowing: false, followers }, startedAt);
});

app.get("/api/v1/products", async (req, res) => {
  const startedAt = Date.now();
  const query = String(req.query.q ?? "").toLowerCase();
  const databaseProducts = await getDatabaseProducts(query);
  if (databaseProducts) return success(res, { items: databaseProducts, nextCursor: null }, startedAt);

  const items = query
    ? demoProducts.filter((product) => `${product.name} ${product.tags.join(" ")}`.toLowerCase().includes(query))
    : demoProducts;
  return success(res, { items, nextCursor: null }, startedAt, { cache: "demo" });
});

app.post("/api/v1/products", upload.array("media", 8), async (req, res) => {
  const startedAt = Date.now();
  const user = await requireProductManager(req, res, startedAt);
  if (!user) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to create products.", startedAt, 503);
  }

  const files = (req.files ?? []) as Express.Multer.File[];
  const body = {
    ...req.body,
    tags: typeof req.body.tags === "string" ? JSON.parse(req.body.tags || "[]") : req.body.tags,
    images: typeof req.body.images === "string" ? JSON.parse(req.body.images || "[]") : req.body.images,
  };
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter valid product details.", startedAt, 422);

  const input = parsed.data;
  const primaryMediaIndex = Math.min(input.primaryMediaIndex, Math.max(files.length - 1, 0));
  const uploadedMedia = files.map((file, index) => ({
    url: `/uploads/products/${file.filename}`,
    type: file.mimetype.startsWith("video/") ? "video" : "image",
    fileName: file.originalname,
    order: index,
    isPrimary: index === primaryMediaIndex,
  }));
  const orderedMedia = [...uploadedMedia].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order);
  const imageUrls = orderedMedia.filter((media) => media.type === "image").map((media) => media.url);
  const baseSlug = input.slug ? input.slug : slugify(input.name);
  const existingSlug = await prisma.product.findUnique({ where: { slug: baseSlug } });
  const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const category = input.category
    ? await prisma.category.upsert({
        where: { slug: slugify(input.category) },
        update: { name: input.category },
        create: { name: input.category, slug: slugify(input.category) },
      })
    : null;

  const product = await prisma.product.create({
    data: {
      vendorId: user.id,
      name: input.name,
      slug,
      description: input.description || null,
      shortDescription: input.shortDescription || null,
      images: imageUrls.length ? imageUrls : input.images,
      media: uploadedMedia,
      categoryId: category?.id,
      price: input.price,
      originalPrice: input.originalPrice === "" ? null : input.originalPrice,
      discountPercent: input.discountPercent === "" ? null : input.discountPercent,
      stockQuantity: input.stockQuantity,
      sku: input.sku || null,
      status: input.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      tags: input.tags,
    },
    include: {
      category: true,
      vendor: true,
    },
  });

  return success(res, mapProduct(product), startedAt, { status: 201 });
});

app.post("/api/v1/products/batch", async (req, res) => {
  const startedAt = Date.now();
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update products.", startedAt, 503);

  const user = await requireProductManager(req, res, startedAt);
  if (!user) return;

  const parsed = productBatchSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter valid batch operation details.", startedAt, 422);

  const input = parsed.data;
  const productIds = [...new Set(input.productIds)];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      ...(user.role === "ADMIN" ? {} : { vendorId: user.id }),
    },
  });
  if (products.length !== productIds.length) {
    return failure(res, "FORBIDDEN", "Some selected products are unavailable or cannot be managed by this user.", startedAt, 403);
  }

  if (input.operation === "delete") {
    await prisma.post.updateMany({ where: { productId: { in: productIds } }, data: { productId: null } });
    const deleted = await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    return success(res, { updatedCount: 0, deletedCount: deleted.count, productIds }, startedAt);
  }

  if (input.operation === "category") {
    if (!input.category) return failure(res, "VALIDATION_ERROR", "Category is required.", startedAt, 422);
    const category = await prisma.category.upsert({
      where: { slug: slugify(input.category) },
      update: { name: input.category },
      create: { name: input.category, slug: slugify(input.category) },
    });
    const updated = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { categoryId: category.id },
    });
    return success(res, { updatedCount: updated.count, deletedCount: 0, productIds }, startedAt);
  }

  if (input.operation === "quantity") {
    if (!input.quantityMode || input.quantity === undefined) {
      return failure(res, "VALIDATION_ERROR", "Quantity mode and value are required.", startedAt, 422);
    }
    await Promise.all(
      products.map((product) => {
        const stockQuantity =
          input.quantityMode === "set"
            ? input.quantity ?? 0
            : input.quantityMode === "increase"
              ? product.stockQuantity + (input.quantity ?? 0)
              : Math.max(0, product.stockQuantity - (input.quantity ?? 0));
        return prisma.product.update({
          where: { id: product.id },
          data: {
            stockQuantity,
            status: stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
          },
        });
      }),
    );
    return success(res, { updatedCount: products.length, deletedCount: 0, productIds }, startedAt);
  }

  if (input.operation === "status") {
    if (!input.status) return failure(res, "VALIDATION_ERROR", "Status is required.", startedAt, 422);
    await Promise.all(
      products.map((product) => {
        const stockQuantity = input.status === "OUT_OF_STOCK" ? 0 : product.stockQuantity > 0 ? product.stockQuantity : 1;
        return prisma.product.update({
          where: { id: product.id },
          data: {
            stockQuantity,
            status: stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
          },
        });
      }),
    );
    return success(res, { updatedCount: products.length, deletedCount: 0, productIds }, startedAt);
  }

  return failure(res, "VALIDATION_ERROR", "Unsupported batch operation.", startedAt, 422);
});

app.get("/api/v1/products/slug/:slug", async (req, res) => {
  const startedAt = Date.now();
  if (canUseDatabase()) {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true, vendor: true },
    });
    if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
    return success(res, mapProduct(product), startedAt);
  }

  const product = demoProducts.find((item) => item.slug === req.params.slug);
  if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
  return success(res, product, startedAt, { cache: "demo" });
});

app.get("/api/v1/products/:id", async (req, res) => {
  const startedAt = Date.now();
  if (canUseDatabase()) {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, vendor: true },
    });
    if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
    return success(res, mapProduct(product), startedAt);
  }

  const product = demoProducts.find((item) => item.id === req.params.id);
  if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
  return success(res, product, startedAt, { cache: "demo" });
});

app.patch("/api/v1/products/:id", upload.array("media", 8), async (req, res) => {
  const startedAt = Date.now();
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update products.", startedAt, 503);

  const productId = getRouteParam(req.params.id);
  const access = await requireProductAccess(productId, req, res, startedAt);
  if (!access) return;

  const files = (req.files ?? []) as Express.Multer.File[];
  const body = {
    ...req.body,
    tags: typeof req.body.tags === "string" ? JSON.parse(req.body.tags || "[]") : req.body.tags,
    images: typeof req.body.images === "string" ? JSON.parse(req.body.images || "[]") : req.body.images,
  };
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter valid product details.", startedAt, 422);

  const input = parsed.data;
  const primaryMediaIndex = Math.min(input.primaryMediaIndex, Math.max(files.length - 1, 0));
  const uploadedMedia = files.map((file, index) => ({
    url: `/uploads/products/${file.filename}`,
    type: file.mimetype.startsWith("video/") ? "video" : "image",
    fileName: file.originalname,
    order: index,
    isPrimary: index === primaryMediaIndex,
  }));
  const orderedMedia = [...uploadedMedia].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order);
  const imageUrls = orderedMedia.filter((media) => media.type === "image").map((media) => media.url);
  const baseSlug = input.slug ? input.slug : slugify(input.name);
  const existingSlug = await prisma.product.findFirst({ where: { slug: baseSlug, NOT: { id: productId } } });
  const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const category = input.category
    ? await prisma.category.upsert({
        where: { slug: slugify(input.category) },
        update: { name: input.category },
        create: { name: input.category, slug: slugify(input.category) },
      })
    : null;

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      slug,
      description: input.description || null,
      shortDescription: input.shortDescription || null,
      images: files.length ? imageUrls : input.images,
      media: files.length ? uploadedMedia : access.product.media,
      categoryId: category?.id,
      price: input.price,
      originalPrice: input.originalPrice === "" ? null : input.originalPrice,
      discountPercent: input.discountPercent === "" ? null : input.discountPercent,
      stockQuantity: input.stockQuantity,
      sku: input.sku || null,
      status: input.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      tags: input.tags,
    },
    include: {
      category: true,
      vendor: true,
    },
  });

  return success(res, mapProduct(product), startedAt);
});

app.delete("/api/v1/products/:id", async (req, res) => {
  const startedAt = Date.now();
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to delete products.", startedAt, 503);

  const productId = getRouteParam(req.params.id);
  const access = await requireProductAccess(productId, req, res, startedAt);
  if (!access) return;

  await prisma.post.updateMany({ where: { productId }, data: { productId: null } });
  await prisma.product.delete({ where: { id: productId } });
  return success(res, { deleted: true, productId }, startedAt);
});

app.get("/api/v1/search", async (req, res) => {
  const startedAt = Date.now();
  const query = String(req.query.q ?? "").toLowerCase();

  if (canUseDatabase()) {
    const [products, posts, creators] = await Promise.all([
      getDatabaseProducts(query),
      prisma.post.findMany({
        where: query
          ? {
              OR: [
                { caption: { contains: query, mode: "insensitive" } },
                { hashtags: { has: query } },
              ],
            }
          : undefined,
        include: {
          creator: true,
          product: { include: { category: true, vendor: true } },
        },
      }),
      prisma.user.findMany({
        where: query ? { username: { contains: query, mode: "insensitive" } } : undefined,
        take: 10,
      }),
    ]);

    return success(res, { products: products ?? [], posts: posts.map(mapPost), creators: creators.map(mapUser) }, startedAt);
  }

  return success(
    res,
    {
      products: demoProducts.filter((product) => product.name.toLowerCase().includes(query)),
      posts: demoPosts.filter((post) => post.caption.toLowerCase().includes(query) || post.hashtags.some((tag) => tag.includes(query))),
      creators: demoUsers.filter((user) => user.username.toLowerCase().includes(query)),
    },
    startedAt,
    { cache: "demo" },
  );
});

app.get("/api/v1/cart", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view your cart.");
  if (!user) return;

  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to view cart.", startedAt, 503);

  return success(res, { items: await getCartLines(user.id) }, startedAt);
});

app.post("/api/v1/cart/add", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to add products to cart.");
  if (!user) return;

  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update cart.", startedAt, 503);

  const parsed = cartQuantitySchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Product and quantity are required.", startedAt, 422);
  const { productId, quantity } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
  if (product.status !== "ACTIVE" || product.stockQuantity < 1) return failure(res, "OUT_OF_STOCK", "Product is out of stock.", startedAt, 409);

  const existing = await prisma.cartItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, 99);
  if (nextQuantity > product.stockQuantity) return failure(res, "STOCK_LIMIT", "Requested quantity is not available.", startedAt, 409);

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { quantity: nextQuantity },
    create: { userId: user.id, productId, quantity: nextQuantity },
  });

  return success(res, { items: await getCartLines(user.id) }, startedAt);
});

app.patch("/api/v1/cart/update", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update cart.");
  if (!user) return;

  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update cart.", startedAt, 503);

  const parsed = cartQuantitySchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Product and quantity are required.", startedAt, 422);
  const { productId, quantity } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);
  if (product.status !== "ACTIVE" || product.stockQuantity < quantity) return failure(res, "STOCK_LIMIT", "Requested quantity is not available.", startedAt, 409);

  await prisma.cartItem.update({
    where: { userId_productId: { userId: user.id, productId } },
    data: { quantity },
  });

  return success(res, { items: await getCartLines(user.id) }, startedAt);
});

app.delete("/api/v1/cart/remove", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update cart.");
  if (!user) return;

  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update cart.", startedAt, 503);

  const { productId } = req.body;
  if (!productId) return failure(res, "VALIDATION_ERROR", "Product is required.", startedAt, 422);
  await prisma.cartItem.deleteMany({ where: { userId: user.id, productId: String(productId) } });
  return success(res, { items: await getCartLines(user.id) }, startedAt);
});

app.post("/api/v1/cart/clear", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update cart.");
  if (!user) return;

  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update cart.", startedAt, 503);

  await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  return success(res, { items: [] }, startedAt);
});

app.get("/api/v1/orders", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view orders.");
  if (!user) return;
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to view orders.", startedAt, 503);

  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return success(res, { items: orders.map(mapOrderSummary), nextCursor: null }, startedAt);
});

app.get("/api/v1/orders/:id", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view orders.");
  if (!user) return;
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to view orders.", startedAt, 503);

  const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: user.id } });
  if (!order) return failure(res, "NOT_FOUND", "Order was not found.", startedAt, 404);
  return success(res, mapOrderDetail(order), startedAt);
});

app.post("/api/v1/orders", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to create an order.");
  if (!user) return;

  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to create orders.", startedAt, 503);

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Shipping address and payment method are required.", startedAt, 422);

  const cartItems = await prisma.cartItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  if (!cartItems.length) return failure(res, "EMPTY_CART", "Your cart is empty.", startedAt, 422);

  const productIds = cartItems.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { category: true, vendor: true } });
  const productsById = new Map(products.map((product) => [product.id, product]));
  for (const item of cartItems) {
    const product = productsById.get(item.productId);
    if (!product) return failure(res, "NOT_FOUND", "A product in your cart was not found.", startedAt, 404);
    if (product.status !== "ACTIVE" || product.stockQuantity < item.quantity) {
      return failure(res, "STOCK_LIMIT", `${product.name} does not have enough stock.`, startedAt, 409);
    }
  }

  let order: OrderRecord;
  try {
    order = await prisma.$transaction(async (tx) => {
    const freshProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
    const freshById = new Map(freshProducts.map((product) => [product.id, product]));
    for (const item of cartItems) {
      const product = freshById.get(item.productId);
      if (!product || product.status !== "ACTIVE" || product.stockQuantity < item.quantity) {
        throw new Error("STOCK_LIMIT");
      }
    }

    await Promise.all(
      cartItems.map((item) => {
        const product = freshById.get(item.productId)!;
        const nextStock = product.stockQuantity - item.quantity;
        return tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: nextStock,
            status: nextStock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
          },
        });
      }),
    );

    const items = cartItems.map((item) => {
      const product = productsById.get(item.productId)!;
      return {
        productId: product.id,
        vendorId: product.vendorId,
        name: product.name,
        imageUrl: product.images[0] ?? null,
        price: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    const created = await tx.order.create({
      data: {
        userId: user.id,
        status: "PENDING",
        subtotal,
        shippingAmount: 0,
        discountAmount: 0,
        total: subtotal,
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus: "PENDING",
        shippingAddress: parsed.data.shippingAddress,
        items,
      },
    });
    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return created;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_LIMIT") {
      return failure(res, "STOCK_LIMIT", "One or more products no longer have enough stock.", startedAt, 409);
    }
    throw error;
  }

  return success(res, mapOrderDetail(order), startedAt, { status: 201 });
});

app.get("/api/v1/posts/:id/comments", (req, res) => {
  const startedAt = Date.now();
  return success(res, { items: demoComments.filter((comment) => comment.postId === req.params.id || req.params.id === "post-cozy"), nextCursor: null }, startedAt, { cache: "demo" });
});

app.post("/api/v1/posts/:id/comments", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to comment.");
  if (!user) return;

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Comment text is required.", startedAt, 422);

  return success(
    res,
    {
      id: crypto.randomUUID(),
      postId: req.params.id,
      user: { ...demoUsers[5], ...user },
      text: parsed.data.text,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    },
    startedAt,
  );
});

app.post("/api/v1/posts/:id/like", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to like posts.");
  if (!user) return;

  return success(res, { postId: req.params.id, liked: true }, startedAt, { cache: "demo" });
});

app.post("/api/v1/posts/:id/share", (req, res) => {
  const startedAt = Date.now();
  return success(res, { postId: req.params.id, shared: true }, startedAt, { cache: "demo" });
});

app.get("/api/v1/dashboard/stats", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view dashboard.");
  if (!user) return;

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && user.role !== "VENDOR") return failure(res, "FORBIDDEN", "Dashboard access is not available for this user.", startedAt, 403);

  if (!canUseDatabase()) {
    return success(res, { users: 0, posts: 0, products: 0, orders: 0, revenue: 0 }, startedAt, { cache: "demo" });
  }

  const [users, posts, products, orders, revenue] = await Promise.all([
    isAdmin ? prisma.user.count() : Promise.resolve(0),
    prisma.post.count({ where: isAdmin ? undefined : { creatorId: user.id } }),
    prisma.product.count({ where: isAdmin ? undefined : { vendorId: user.id } }),
    prisma.order.count({ where: isAdmin ? undefined : { userId: user.id } }),
    prisma.order.aggregate({
      where: isAdmin ? undefined : { userId: user.id },
      _sum: { total: true },
    }),
  ]);

  return success(
    res,
    {
      users,
      posts,
      products,
      orders,
      revenue: revenue._sum.total ?? 0,
    },
    startedAt,
  );
});

app.get("/api/v1/dashboard/orders", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view dashboard orders.");
  if (!user) return;
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && user.role !== "VENDOR") return failure(res, "FORBIDDEN", "Dashboard access is not available for this user.", startedAt, 403);
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to view orders.", startedAt, 503);

  const orders = await prisma.order.findMany({
    where: isAdmin ? undefined : { items: { some: { vendorId: user.id } } },
    orderBy: { createdAt: "desc" },
  });
  return success(res, { items: orders.map(mapOrderSummary), nextCursor: null }, startedAt);
});

app.get("/api/v1/dashboard/orders/:id", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to view dashboard orders.");
  if (!user) return;
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && user.role !== "VENDOR") return failure(res, "FORBIDDEN", "Dashboard access is not available for this user.", startedAt, 403);
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to view orders.", startedAt, 503);

  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      ...(isAdmin ? {} : { items: { some: { vendorId: user.id } } }),
    },
  });
  if (!order) return failure(res, "NOT_FOUND", "Order was not found.", startedAt, 404);
  return success(res, mapOrderDetail(order), startedAt);
});

app.patch("/api/v1/dashboard/orders/:id/status", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update orders.");
  if (!user) return;
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && user.role !== "VENDOR") return failure(res, "FORBIDDEN", "Dashboard access is not available for this user.", startedAt, 403);
  if (!canUseDatabase()) return failure(res, "DATABASE_UNAVAILABLE", "Database is required to update orders.", startedAt, 503);

  const parsed = orderStatusSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Choose a valid order status.", startedAt, 422);

  const existing = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      ...(isAdmin ? {} : { items: { some: { vendorId: user.id } } }),
    },
  });
  if (!existing) return failure(res, "NOT_FOUND", "Order was not found.", startedAt, 404);

  const order = await prisma.order.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
  });
  return success(res, mapOrderDetail(order), startedAt);
});

app.get("/api/v1/dashboard/products", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireProductManager(req, res, startedAt);
  if (!user) return;

  if (!canUseDatabase()) {
    return success(res, { items: [], nextCursor: null }, startedAt, { cache: "demo" });
  }

  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? undefined : { vendorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      vendor: true,
    },
  });

  return success(res, { items: products.map(mapProduct), nextCursor: null }, startedAt);
});

app.get("/api/v1/dashboard/products/:id", async (req, res) => {
  const startedAt = Date.now();
  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to edit products.", startedAt, 503);
  }

  const productId = getRouteParam(req.params.id);
  const access = await requireProductAccess(productId, req, res, startedAt);
  if (!access) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      vendor: true,
    },
  });
  if (!product) return failure(res, "NOT_FOUND", "Product was not found.", startedAt, 404);

  return success(res, mapProduct(product), startedAt);
});

app.get("/api/v1/dashboard/categories", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireProductManager(req, res, startedAt);
  if (!user) return;

  if (!canUseDatabase()) {
    return success(res, { items: [], nextCursor: null }, startedAt, { cache: "demo" });
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return success(res, { items: categories.map(mapCategory), nextCursor: null }, startedAt);
});

app.post("/api/v1/dashboard/categories", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireProductManager(req, res, startedAt);
  if (!user) return;

  if (!canUseDatabase()) {
    return failure(res, "DATABASE_UNAVAILABLE", "Database is required to create categories.", startedAt, 503);
  }

  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Please enter valid category details.", startedAt, 422);

  const input = parsed.data;
  const parentId = input.parentId || null;
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) return failure(res, "PARENT_NOT_FOUND", "Parent category was not found.", startedAt, 404);
  }

  const baseSlug = input.slug ? input.slug : slugify(input.name);
  const existingSlug = await prisma.category.findUnique({ where: { slug: baseSlug } });
  const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      parentId,
      imageUrl: input.imageUrl || null,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return success(res, mapCategory(category), startedAt, { status: 201 });
});

app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  void _next;
  console.error(error);
  return failure(res, "INTERNAL_ERROR", "Something went wrong.", Date.now(), 500);
});

app.listen(port, () => {
  console.log(`Express API running at http://localhost:${port}`);
});
