/* eslint-disable @typescript-eslint/no-explicit-any -- mapper boundary accepts populated Mongoose documents. */
import { stringId } from "./http";

export function mapUser(user: any) {
  return {
    id: stringId(user._id),
    name: user.name,
    username: user.username,
    email: user.email || undefined,
    avatarUrl: user.avatarUrl || "",
    bio: user.bio || undefined,
    role: user.role,
  };
}
export function mapSessionUser(user: any) {
  const { bio: _bio, ...session } = mapUser(user);
  void _bio;
  return session;
}
export function mapProduct(product: any) {
  const category =
    product.categoryId && typeof product.categoryId === "object"
      ? product.categoryId
      : null;
  const vendor =
    product.vendorId && typeof product.vendorId === "object"
      ? product.vendorId
      : null;
  return {
    id: stringId(product._id),
    vendorId: stringId(vendor?._id ?? product.vendorId),
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    images: product.images ?? [],
    media: product.media ?? [],
    category: category?.name ?? "Uncategorized",
    price: product.price,
    originalPrice: product.originalPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
    stockQuantity: product.stockQuantity,
    sku: product.sku || "",
    status: product.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "ACTIVE",
    tags: product.tags ?? [],
    vendorName: vendor?.username ?? "",
  };
}
export function mapPost(post: any) {
  return {
    id: stringId(post._id),
    slug: post.slug,
    creator: mapUser(post.creatorId),
    caption: post.caption,
    hashtags: post.hashtags ?? [],
    media: (post.media ?? []).map((m: any) => ({
      url: m.url,
      type: m.type ?? "image",
      width: m.width ?? 0,
      height: m.height ?? 0,
    })),
    product:
      post.productId && typeof post.productId === "object"
        ? mapProduct(post.productId)
        : undefined,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    shareCount: post.shareCount ?? 0,
    isLiked: Boolean(post.isLiked),
  };
}
export function mapOrder(order: any) {
  const base = {
    id: stringId(order._id),
    userId: stringId(order.userId),
    status: order.status,
    subtotal: order.subtotal,
    shippingAmount: order.shippingAmount,
    discountAmount: order.discountAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    itemCount: (order.items ?? []).reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    ),
    customerName: order.shippingAddress?.fullName ?? "",
    createdAt: new Date(order.createdAt).toISOString(),
  };
  return {
    ...base,
    shippingAddress: order.shippingAddress,
    items: (order.items ?? []).map((item: any) => ({
      ...(item.toObject?.() ?? item),
      productId: stringId(item.productId),
      vendorId: stringId(item.vendorId),
      imageUrl: item.imageUrl || undefined,
    })),
  };
}
export function mapAddress(address: any) {
  return {
    id: stringId(address._id),
    userId: stringId(address.userId),
    label: address.label || undefined,
    fullName: address.fullName,
    phone: address.phone,
    addressLine: address.addressLine,
    city: address.city,
    state: address.state || undefined,
    country: address.country,
    postalCode: address.postalCode || undefined,
    isDefault: address.isDefault,
    createdAt: new Date(address.createdAt).toISOString(),
    updatedAt: new Date(address.updatedAt).toISOString(),
  };
}
