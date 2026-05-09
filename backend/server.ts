import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { createSessionToken, sessionCookieName, type SessionUser, verifySessionToken } from "../lib/auth/token";
import { canUseDatabase, prisma } from "../lib/prisma";
import { demoComments, demoPosts, demoProducts, demoStories, demoUsers } from "../lib/demo-data";
import { cartQuantitySchema, commentSchema, loginSchema, orderSchema, signupSchema } from "../lib/validation/schemas";
import type { DemoUser, FeedPost, Product, Story } from "../lib/types";

const app = express();
const port = Number(process.env.BACKEND_PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

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

function mapUser(user: PostWithRelations["creator"] | ProductWithRelations["vendor"]): DemoUser {
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

function mapProduct(product: ProductWithRelations): Product {
  return {
    id: product.id,
    vendorId: product.vendorId,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    images: product.images,
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

async function getDatabasePosts(limit = 10) {
  if (!canUseDatabase()) return null;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      creator: true,
      product: {
        include: {
          category: true,
          vendor: true,
        },
      },
    },
  });

  return posts.map(mapPost);
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
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: {
        creator: true,
        product: {
          include: {
            category: true,
            vendor: true,
          },
        },
      },
    });
    if (!post) return failure(res, "NOT_FOUND", "Post was not found.", startedAt, 404);
    return success(res, mapPost(post), startedAt);
  }

  const post = demoPosts.find((item) => item.slug === req.params.slug);
  if (!post) return failure(res, "NOT_FOUND", "Post was not found.", startedAt, 404);
  return success(res, post, startedAt, { cache: "demo" });
});

app.get("/api/v1/stories", async (_req, res) => {
  const startedAt = Date.now();
  const databasePosts = await getDatabasePosts();
  if (databasePosts) return success(res, { items: getStoriesFromPosts(databasePosts) }, startedAt);

  return success(res, { items: demoStories }, startedAt, { cache: "demo" });
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

  return success(res, { items: [] }, startedAt, { cache: "demo" });
});

app.post("/api/v1/cart/add", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to add products to cart.");
  if (!user) return;

  const parsed = cartQuantitySchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Product and quantity are required.", startedAt, 422);
  return success(res, { item: parsed.data }, startedAt, { cache: "demo" });
});

app.patch("/api/v1/cart/update", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update cart.");
  if (!user) return;

  const parsed = cartQuantitySchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Product and quantity are required.", startedAt, 422);
  return success(res, { item: parsed.data }, startedAt, { cache: "demo" });
});

app.delete("/api/v1/cart/remove", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update cart.");
  if (!user) return;

  const { productId } = req.body;
  if (!productId) return failure(res, "VALIDATION_ERROR", "Product is required.", startedAt, 422);
  return success(res, { productId }, startedAt, { cache: "demo" });
});

app.post("/api/v1/cart/clear", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to update cart.");
  if (!user) return;

  return success(res, { cleared: true }, startedAt, { cache: "demo" });
});

app.post("/api/v1/orders", async (req, res) => {
  const startedAt = Date.now();
  const user = await requireSession(req, res, startedAt, "Login is required to create an order.");
  if (!user) return;

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return failure(res, "VALIDATION_ERROR", "Shipping address and payment method are required.", startedAt, 422);

  return success(
    res,
    {
      id: crypto.randomUUID(),
      userId: user.id,
      status: "PENDING",
      paymentMethod: parsed.data.paymentMethod,
      shippingAddress: parsed.data.shippingAddress,
    },
    startedAt,
    { cache: "demo" },
  );
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

app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  void _next;
  console.error(error);
  return failure(res, "INTERNAL_ERROR", "Something went wrong.", Date.now(), 500);
});

app.listen(port, () => {
  console.log(`Express API running at http://localhost:${port}`);
});
