/* eslint-disable @typescript-eslint/no-explicit-any -- aggregate documents are normalized at this HTTP boundary. */
import { Router } from "express";
import {
  categoryCreateSchema,
  orderStatusSchema,
} from "../../lib/validation/schemas";
import { Category, Order, Post, Product, User } from "../models";
import { requireManager } from "../middleware/auth";
import { productPopulate } from "../services/catalog.service";
import { AppError, slugify, success } from "../utils/http";
import { mapOrder, mapProduct } from "../utils/mappers";

export const dashboardRouter = Router();
dashboardRouter.use(requireManager);
dashboardRouter.get("/stats", async (req, res) => {
  const admin = req.authUser!.role === "ADMIN";
  const productFilter = admin ? {} : { vendorId: req.authUser!.id };
  const orderFilter = admin ? {} : { "items.vendorId": req.authUser!.id };
  const [users, posts, products, orders, revenue] = await Promise.all([
    admin ? User.countDocuments() : 0,
    Post.countDocuments(admin ? {} : { creatorId: req.authUser!.id }),
    Product.countDocuments(productFilter),
    Order.countDocuments(orderFilter),
    Order.aggregate([
      { $match: orderFilter },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);
  return success(req, res, {
    users,
    posts,
    products,
    orders,
    revenue: revenue[0]?.total ?? 0,
  });
});
dashboardRouter.get("/orders", async (req, res) => {
  const filter =
    req.authUser!.role === "ADMIN"
      ? {}
      : { "items.vendorId": req.authUser!.id };
  return success(req, res, {
    items: (await Order.find(filter).sort({ createdAt: -1 })).map(mapOrder),
    nextCursor: null,
  });
});
dashboardRouter.get("/orders/:id", async (req, res) => {
  const filter = {
    _id: req.params.id,
    ...(req.authUser!.role === "ADMIN"
      ? {}
      : { "items.vendorId": req.authUser!.id }),
  };
  const order = await Order.findOne(filter);
  if (!order) throw new AppError(404, "NOT_FOUND", "Order was not found.");
  return success(req, res, mapOrder(order));
});
dashboardRouter.patch("/orders/:id/status", async (req, res) => {
  const parsed = orderStatusSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(422, "VALIDATION_ERROR", "Choose a valid order status.");
  const filter = {
    _id: req.params.id,
    ...(req.authUser!.role === "ADMIN"
      ? {}
      : { "items.vendorId": req.authUser!.id }),
  };
  const order = await Order.findOneAndUpdate(
    filter,
    { status: parsed.data.status },
    { returnDocument: "after" },
  );
  if (!order) throw new AppError(404, "NOT_FOUND", "Order was not found.");
  return success(req, res, mapOrder(order));
});
dashboardRouter.get("/products", async (req, res) => {
  const products = await Product.find(
    req.authUser!.role === "ADMIN" ? {} : { vendorId: req.authUser!.id },
  )
    .sort({ createdAt: -1 })
    .populate(productPopulate);
  return success(req, res, {
    items: products.map(mapProduct),
    nextCursor: null,
  });
});
dashboardRouter.get("/products/:id", async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    ...(req.authUser!.role === "ADMIN" ? {} : { vendorId: req.authUser!.id }),
  }).populate(productPopulate);
  if (!product) throw new AppError(404, "NOT_FOUND", "Product was not found.");
  return success(req, res, mapProduct(product));
});
dashboardRouter.get("/categories", async (req, res) => {
  const categories = await Category.find().sort({ parentId: 1, name: 1 });
  const counts = await Product.aggregate([
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((item) => [String(item._id), item.count]));
  return success(req, res, {
    items: categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ? String(c.parentId) : undefined,
      imageUrl: c.imageUrl || undefined,
      productCount: byId.get(c.id) ?? 0,
      createdAt: c.createdAt.toISOString(),
    })),
    nextCursor: null,
  });
});
dashboardRouter.post("/categories", async (req, res) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter valid category details.",
    );
  if (
    parsed.data.parentId &&
    !(await Category.exists({ _id: parsed.data.parentId }))
  )
    throw new AppError(
      404,
      "PARENT_NOT_FOUND",
      "Parent category was not found.",
    );
  const base = parsed.data.slug || slugify(parsed.data.name);
  const slug = (await Category.exists({ slug: base }))
    ? `${base}-${Date.now().toString(36)}`
    : base;
  const category = await Category.create({
    ...parsed.data,
    slug,
    parentId: parsed.data.parentId || undefined,
    imageUrl: parsed.data.imageUrl || undefined,
  });
  return success(
    req,
    res,
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ? String(category.parentId) : undefined,
      imageUrl: category.imageUrl || undefined,
      productCount: 0,
      createdAt: category.createdAt.toISOString(),
    },
    201,
  );
});
