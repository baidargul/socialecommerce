import mongoose, { Schema, model, models } from "mongoose";

const options = { timestamps: true, versionKey: false } as const;
const objectId = Schema.Types.ObjectId;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, unique: true, sparse: true },
    password: String,
    avatarUrl: String,
    bio: String,
    role: {
      type: String,
      enum: ["CUSTOMER", "CREATOR", "VENDOR", "ADMIN"],
      default: "CUSTOMER",
    },
    isVerified: { type: Boolean, default: false },
  },
  options,
);

const mediaSchema = new Schema(
  {
    url: String,
    type: String,
    fileName: String,
    width: Number,
    height: Number,
    duration: Number,
    order: Number,
    isPrimary: Boolean,
  },
  { _id: false },
);
const stockReservationSchema = new Schema(
  {
    attemptId: { type: objectId, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false },
);
const productSchema = new Schema(
  {
    vendorId: { type: objectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    shortDescription: String,
    images: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },
    categoryId: { type: objectId, ref: "Category", index: true },
    price: { type: Number, required: true },
    originalPrice: Number,
    discountPercent: Number,
    stockQuantity: { type: Number, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "HIDDEN", "ARCHIVED"],
      default: "ACTIVE",
    },
    tags: { type: [String], default: [] },
    stockReservations: {
      type: [stockReservationSchema],
      default: [],
      select: false,
    },
  },
  options,
);
productSchema.index({ createdAt: -1 });

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    parentId: { type: objectId, ref: "Category", index: true },
    imageUrl: String,
  },
  options,
);
const postSchema = new Schema(
  {
    creatorId: { type: objectId, ref: "User", required: true, index: true },
    caption: { type: String, required: true },
    hashtags: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },
    productId: { type: objectId, ref: "Product", index: true },
    slug: { type: String, unique: true, required: true },
    status: { type: String, default: "PUBLISHED" },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  options,
);
postSchema.index({ createdAt: -1 });

const commentSchema = new Schema(
  {
    postId: { type: objectId, ref: "Post", required: true, index: true },
    userId: { type: objectId, ref: "User", required: true, index: true },
    parentId: { type: objectId, ref: "Comment" },
    text: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  options,
);
const likeSchema = new Schema(
  {
    postId: { type: objectId, ref: "Post", required: true },
    userId: { type: objectId, ref: "User", required: true },
  },
  options,
);
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });
const followSchema = new Schema(
  {
    followerId: { type: objectId, ref: "User", required: true },
    followingId: { type: objectId, ref: "User", required: true },
  },
  options,
);
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
const cartItemSchema = new Schema(
  {
    userId: { type: objectId, required: true },
    productId: { type: objectId, required: true },
    quantity: { type: Number, default: 1 },
  },
  options,
);
cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
const addressSchema = new Schema(
  {
    userId: { type: objectId, ref: "User", required: true, index: true },
    label: String,
    fullName: String,
    phone: String,
    addressLine: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    isDefault: { type: Boolean, default: false },
  },
  options,
);
const shippingSchema = new Schema(
  {
    fullName: String,
    phone: String,
    addressLine: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  { _id: false },
);
const orderItemSchema = new Schema(
  {
    productId: objectId,
    vendorId: objectId,
    name: String,
    imageUrl: String,
    price: Number,
    quantity: Number,
    total: Number,
  },
  { _id: false },
);
const orderSchema = new Schema(
  {
    userId: { type: objectId, ref: "User", required: true, index: true },
    status: { type: String, default: "PENDING" },
    subtotal: Number,
    shippingAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: Number,
    paymentMethod: String,
    paymentStatus: { type: String, default: "PENDING" },
    shippingAddress: shippingSchema,
    items: [orderItemSchema],
  },
  options,
);
const reservationSchema = new Schema(
  { productId: objectId, quantity: Number },
  { _id: false },
);
const checkoutAttemptSchema = new Schema(
  {
    userId: { type: objectId, required: true },
    key: { type: String, required: true },
    status: {
      type: String,
      enum: ["RESERVING", "COMMITTED", "ROLLED_BACK"],
      default: "RESERVING",
    },
    reservations: [reservationSchema],
    orderId: { type: objectId, ref: "Order" },
    expiresAt: { type: Date, index: true },
  },
  options,
);
checkoutAttemptSchema.index({ userId: 1, key: 1 }, { unique: true });

function existingOrCreate(name: string, schema: Schema) {
  return models[name] ?? model(name, schema);
}
export const User = existingOrCreate("User", userSchema);
export const Product = existingOrCreate("Product", productSchema);
export const Category = existingOrCreate("Category", categorySchema);
export const Post = existingOrCreate("Post", postSchema);
export const Comment = existingOrCreate("Comment", commentSchema);
export const Like = existingOrCreate("Like", likeSchema);
export const Follow = existingOrCreate("Follow", followSchema);
export const CartItem = existingOrCreate("CartItem", cartItemSchema);
export const AddressModel = existingOrCreate("UserAddress", addressSchema);
export const Order = existingOrCreate("Order", orderSchema);
export const CheckoutAttempt = existingOrCreate(
  "CheckoutAttempt",
  checkoutAttemptSchema,
);

export async function initializeIndexes() {
  await Promise.all(
    Object.values(mongoose.models).map((entry) => entry.init()),
  );
}
