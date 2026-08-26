/* eslint-disable @typescript-eslint/no-explicit-any -- populated media documents are mapped at this HTTP boundary. */
import { Router } from "express";
import {
  productBatchSchema,
  productCreateSchema,
} from "../../lib/validation/schemas";
import { Product, Post, User } from "../models";
import { requireManager } from "../middleware/auth";
import { productUpload, publicUploadUrl } from "../middleware/upload";
import {
  parseProductBody,
  productPopulate,
  resolveCategory,
  uniqueSlug,
} from "../services/catalog.service";
import { AppError, success } from "../utils/http";
import { mapPost, mapProduct, mapUser } from "../utils/mappers";

export const catalogRouter = Router();
async function productAccess(
  id: string | string[],
  user: NonNullable<Express.Request["authUser"]>,
) {
  const product = await Product.findById(String(id));
  if (!product) throw new AppError(404, "NOT_FOUND", "Product was not found.");
  if (user.role !== "ADMIN" && String(product.vendorId) !== user.id)
    throw new AppError(
      403,
      "FORBIDDEN",
      "You can only manage your own products.",
    );
  return product;
}
function mediaFromFiles(files: Express.Multer.File[], primaryIndex: number) {
  return files.map((file, index) => ({
    url: publicUploadUrl("products", file.filename),
    type: file.mimetype.startsWith("video/") ? "video" : "image",
    fileName: file.originalname,
    order: index,
    isPrimary: index === Math.min(primaryIndex, Math.max(files.length - 1, 0)),
  }));
}

catalogRouter.get("/products", async (req, res) => {
  const query = String(req.query.q ?? "").trim();
  const filter = query
    ? {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      }
    : {};
  const items = await Product.find(filter)
    .sort({ createdAt: -1 })
    .populate(productPopulate);
  return success(req, res, { items: items.map(mapProduct), nextCursor: null });
});
catalogRouter.post(
  "/products",
  requireManager,
  productUpload,
  async (req, res) => {
    const parsed = productCreateSchema.safeParse(parseProductBody(req.body));
    if (!parsed.success)
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Please enter valid product details.",
      );
    const files = (req.files ?? []) as Express.Multer.File[];
    const media = mediaFromFiles(files, parsed.data.primaryMediaIndex);
    const category = await resolveCategory(parsed.data.category);
    const product = await Product.create({
      ...parsed.data,
      vendorId: req.authUser!.id,
      slug: await uniqueSlug(parsed.data.slug || parsed.data.name),
      categoryId: category?._id,
      description: parsed.data.description || undefined,
      shortDescription: parsed.data.shortDescription || undefined,
      images: media
        .filter((item) => item.type === "image")
        .map((item) => item.url)
        .concat(files.length ? [] : parsed.data.images),
      media,
      originalPrice: parsed.data.originalPrice || undefined,
      discountPercent: parsed.data.discountPercent || undefined,
      sku: parsed.data.sku || undefined,
      status: parsed.data.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
    });
    await product.populate(productPopulate);
    return success(req, res, mapProduct(product), 201);
  },
);
catalogRouter.post("/products/batch", requireManager, async (req, res) => {
  const parsed = productBatchSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter valid batch operation details.",
    );
  const input = parsed.data;
  const filter = {
    _id: { $in: input.productIds },
    ...(req.authUser!.role === "ADMIN" ? {} : { vendorId: req.authUser!.id }),
  };
  const count = await Product.countDocuments(filter);
  if (count !== new Set(input.productIds).size)
    throw new AppError(
      403,
      "FORBIDDEN",
      "Some selected products cannot be managed by this user.",
    );
  if (input.operation === "delete") {
    await Post.updateMany(
      { productId: { $in: input.productIds } },
      { $unset: { productId: 1 } },
    );
    const result = await Product.deleteMany(filter);
    return success(req, res, {
      updatedCount: 0,
      deletedCount: result.deletedCount,
      productIds: input.productIds,
    });
  }
  if (input.operation === "category") {
    if (!input.category)
      throw new AppError(422, "VALIDATION_ERROR", "Category is required.");
    const category = await resolveCategory(input.category);
    const result = await Product.updateMany(filter, {
      categoryId: category?._id,
    });
    return success(req, res, {
      updatedCount: result.modifiedCount,
      deletedCount: 0,
      productIds: input.productIds,
    });
  }
  if (input.operation === "quantity") {
    if (input.quantity === undefined || !input.quantityMode)
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Quantity mode and value are required.",
      );
    const products = await Product.find(filter);
    await Promise.all(
      products.map(async (p) => {
        p.stockQuantity =
          input.quantityMode === "set"
            ? input.quantity!
            : input.quantityMode === "increase"
              ? p.stockQuantity + input.quantity!
              : Math.max(0, p.stockQuantity - input.quantity!);
        p.status = p.stockQuantity ? "ACTIVE" : "OUT_OF_STOCK";
        await p.save();
      }),
    );
    return success(req, res, {
      updatedCount: products.length,
      deletedCount: 0,
      productIds: input.productIds,
    });
  }
  if (!input.status)
    throw new AppError(422, "VALIDATION_ERROR", "Status is required.");
  const result = await Product.updateMany(
    filter,
    input.status === "OUT_OF_STOCK"
      ? { status: "OUT_OF_STOCK", stockQuantity: 0 }
      : { status: "ACTIVE", $max: { stockQuantity: 1 } },
  );
  return success(req, res, {
    updatedCount: result.modifiedCount,
    deletedCount: 0,
    productIds: input.productIds,
  });
});
catalogRouter.get("/products/slug/:slug", async (req, res) => {
  const product = await Product.findOne({
    slug: String(req.params.slug),
  }).populate(productPopulate);
  if (!product) throw new AppError(404, "NOT_FOUND", "Product was not found.");
  return success(req, res, mapProduct(product));
});
catalogRouter.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    productPopulate,
  );
  if (!product) throw new AppError(404, "NOT_FOUND", "Product was not found.");
  return success(req, res, mapProduct(product));
});
catalogRouter.patch(
  "/products/:id",
  requireManager,
  productUpload,
  async (req, res) => {
    const current = await productAccess(req.params.id, req.authUser!);
    const parsed = productCreateSchema.safeParse(parseProductBody(req.body));
    if (!parsed.success)
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Please enter valid product details.",
      );
    const files = (req.files ?? []) as Express.Multer.File[];
    const media = files.length
      ? mediaFromFiles(files, parsed.data.primaryMediaIndex)
      : current.media;
    const category = await resolveCategory(parsed.data.category);
    Object.assign(current, {
      ...parsed.data,
      slug: await uniqueSlug(parsed.data.slug || parsed.data.name, current.id),
      categoryId: category?._id,
      images: files.length
        ? media.filter((m: any) => m.type === "image").map((m: any) => m.url)
        : parsed.data.images,
      media,
      originalPrice: parsed.data.originalPrice || undefined,
      discountPercent: parsed.data.discountPercent || undefined,
      sku: parsed.data.sku || undefined,
      status: parsed.data.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
    });
    await current.save();
    await current.populate(productPopulate);
    return success(req, res, mapProduct(current));
  },
);
catalogRouter.delete("/products/:id", requireManager, async (req, res) => {
  await productAccess(req.params.id, req.authUser!);
  await Post.updateMany(
    { productId: req.params.id },
    { $unset: { productId: 1 } },
  );
  await Product.findByIdAndDelete(req.params.id);
  return success(req, res, { deleted: true, productId: req.params.id });
});
catalogRouter.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return success(req, res, { products: [], posts: [], users: [] });

  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = { $regex: escapedQuery, $options: "i" };
  const [products, posts, users] = await Promise.all([
    Product.find({ $or: [{ name: pattern }, { tags: pattern }] })
      .sort({ createdAt: -1 })
      .limit(24)
      .populate(productPopulate),
    Post.find({
      status: "PUBLISHED",
      $or: [{ caption: pattern }, { hashtags: pattern }],
    })
      .sort({ createdAt: -1 })
      .limit(24)
      .populate([
        { path: "creatorId" },
        { path: "productId", populate: productPopulate },
      ]),
    User.find({
      $or: [{ name: pattern }, { username: pattern }, { bio: pattern }],
    })
      .sort({ createdAt: -1 })
      .limit(20),
  ]);
  return success(req, res, {
    products: products.map(mapProduct),
    posts: posts.map(mapPost),
    users: users.map((user) => {
      const { email: _email, ...publicUser } = mapUser(user);
      void _email;
      return publicUser;
    }),
  });
});
