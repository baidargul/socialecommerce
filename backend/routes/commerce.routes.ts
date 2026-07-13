import crypto from "node:crypto";
import { Router } from "express";
import {
  addressSchema,
  cartQuantitySchema,
  orderSchema,
} from "../../lib/validation/schemas";
import {
  AddressModel,
  CartItem,
  CheckoutAttempt,
  Order,
  Product,
} from "../models";
import { requireAuth } from "../middleware/auth";
import { productPopulate } from "../services/catalog.service";
import { releaseAttempt } from "../services/checkout.service";
import { AppError, stringId, success } from "../utils/http";
import { mapOrder, mapProduct } from "../utils/mappers";

export const commerceRouter = Router();
commerceRouter.use(requireAuth);
async function cartLines(userId: string) {
  const cart = await CartItem.find({ userId }).sort({ createdAt: 1 });
  const products = await Product.find({
    _id: { $in: cart.map((item) => item.productId) },
  }).populate(productPopulate);
  const byId = new Map(
    products.map((product) => [product.id, mapProduct(product)]),
  );
  return cart.flatMap((item) =>
    byId.has(stringId(item.productId))
      ? [
          {
            product: byId.get(stringId(item.productId)),
            quantity: item.quantity,
          },
        ]
      : [],
  );
}
commerceRouter.get("/cart", async (req, res) =>
  success(req, res, { items: await cartLines(req.authUser!.id) }),
);
commerceRouter.post("/cart/add", async (req, res) => {
  const parsed = cartQuantitySchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Product and quantity are required.",
    );
  const product = await Product.findById(parsed.data.productId);
  if (!product) throw new AppError(404, "NOT_FOUND", "Product was not found.");
  if (product.status !== "ACTIVE")
    throw new AppError(409, "OUT_OF_STOCK", "Product is out of stock.");
  const existing = await CartItem.findOne({
    userId: req.authUser!.id,
    productId: product.id,
  });
  const quantity = Math.min(
    (existing?.quantity ?? 0) + parsed.data.quantity,
    99,
  );
  if (quantity > product.stockQuantity)
    throw new AppError(
      409,
      "STOCK_LIMIT",
      "Requested quantity is not available.",
    );
  await CartItem.updateOne(
    { userId: req.authUser!.id, productId: product.id },
    {
      $set: { quantity },
      $setOnInsert: { userId: req.authUser!.id, productId: product.id },
    },
    { upsert: true },
  );
  return success(req, res, { items: await cartLines(req.authUser!.id) });
});
commerceRouter.patch("/cart/update", async (req, res) => {
  const parsed = cartQuantitySchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Product and quantity are required.",
    );
  const product = await Product.findOne({
    _id: parsed.data.productId,
    status: "ACTIVE",
    stockQuantity: { $gte: parsed.data.quantity },
  });
  if (!product)
    throw new AppError(
      409,
      "STOCK_LIMIT",
      "Requested quantity is not available.",
    );
  const item = await CartItem.findOneAndUpdate(
    { userId: req.authUser!.id, productId: product.id },
    { quantity: parsed.data.quantity },
  );
  if (!item) throw new AppError(404, "NOT_FOUND", "Cart item was not found.");
  return success(req, res, { items: await cartLines(req.authUser!.id) });
});
commerceRouter.delete("/cart/remove", async (req, res) => {
  await CartItem.deleteOne({
    userId: req.authUser!.id,
    productId: String(req.body.productId ?? ""),
  });
  return success(req, res, { items: await cartLines(req.authUser!.id) });
});
commerceRouter.post("/cart/clear", async (req, res) => {
  await CartItem.deleteMany({ userId: req.authUser!.id });
  return success(req, res, { items: [] });
});
commerceRouter.get("/orders", async (req, res) =>
  success(req, res, {
    items: (
      await Order.find({ userId: req.authUser!.id }).sort({ createdAt: -1 })
    ).map(mapOrder),
    nextCursor: null,
  }),
);
commerceRouter.get("/orders/:id", async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.authUser!.id,
  });
  if (!order) throw new AppError(404, "NOT_FOUND", "Order was not found.");
  return success(req, res, mapOrder(order));
});
commerceRouter.post("/orders", async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Shipping address and payment method are required.",
    );
  const key = String(req.headers["idempotency-key"] ?? crypto.randomUUID());
  const prior = await CheckoutAttempt.findOne({
    userId: req.authUser!.id,
    key,
  });
  if (prior?.status === "COMMITTED" && prior.orderId) {
    const order = await Order.findById(prior.orderId);
    if (order) return success(req, res, mapOrder(order));
  }
  if (prior)
    throw new AppError(
      409,
      "CHECKOUT_IN_PROGRESS",
      "This checkout request is already being processed.",
    );
  let shippingAddress = parsed.data.shippingAddress;
  if (parsed.data.addressId) {
    const saved = await AddressModel.findOne({
      _id: parsed.data.addressId,
      userId: req.authUser!.id,
    });
    if (!saved)
      throw new AppError(404, "NOT_FOUND", "Saved address was not found.");
    shippingAddress = {
      fullName: saved.fullName,
      phone: saved.phone,
      addressLine: saved.addressLine,
      city: saved.city,
      state: saved.state,
      country: saved.country,
      postalCode: saved.postalCode,
    };
  }
  if (!shippingAddress)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Choose a saved address or enter a shipping address.",
    );
  const cart = await CartItem.find({ userId: req.authUser!.id });
  if (!cart.length)
    throw new AppError(422, "EMPTY_CART", "Your cart is empty.");
  const products = await Product.find({
    _id: { $in: cart.map((item) => item.productId) },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const attempt = await CheckoutAttempt.create({
    userId: req.authUser!.id,
    key,
    expiresAt: new Date(Date.now() + 10 * 60_000),
  });
  try {
    for (const item of cart) {
      const reserved = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          status: "ACTIVE",
          stockQuantity: { $gte: item.quantity },
        },
        {
          $inc: { stockQuantity: -item.quantity },
          $push: {
            stockReservations: {
              attemptId: attempt._id,
              quantity: item.quantity,
            },
          },
        },
        { returnDocument: "after" },
      );
      if (!reserved)
        throw new AppError(
          409,
          "STOCK_LIMIT",
          "One or more products no longer have enough stock.",
        );
      attempt.reservations.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }
    await attempt.save();
    const items = cart.map((item) => {
      const product = byId.get(stringId(item.productId));
      if (!product)
        throw new AppError(
          404,
          "NOT_FOUND",
          "A product in your cart was not found.",
        );
      return {
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        imageUrl: product.images[0],
        price: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const order = await Order.create({
      userId: req.authUser!.id,
      status: "PENDING",
      subtotal,
      shippingAmount: 0,
      discountAmount: 0,
      total: subtotal,
      paymentMethod: parsed.data.paymentMethod,
      paymentStatus: "PENDING",
      shippingAddress,
      items,
    });
    attempt.status = "COMMITTED";
    attempt.orderId = order._id;
    await attempt.save();
    await Product.updateMany(
      { "stockReservations.attemptId": attempt._id },
      { $pull: { stockReservations: { attemptId: attempt._id } } },
    );
    await Product.updateMany(
      { _id: { $in: cart.map((item) => item.productId) }, stockQuantity: 0 },
      { status: "OUT_OF_STOCK" },
    );
    await CartItem.deleteMany({ userId: req.authUser!.id });
    if (parsed.data.saveAddress && !parsed.data.addressId) {
      const valid = addressSchema.safeParse({
        ...shippingAddress,
        label: "Shipping",
        isDefault:
          (await AddressModel.countDocuments({ userId: req.authUser!.id })) ===
          0,
      });
      if (valid.success)
        await AddressModel.create({ ...valid.data, userId: req.authUser!.id });
    }
    return success(req, res, mapOrder(order), 201);
  } catch (error) {
    await releaseAttempt(attempt);
    throw error;
  }
});
