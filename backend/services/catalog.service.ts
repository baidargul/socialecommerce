import { Category, Product } from "../models";
import { slugify } from "../utils/http";

export const productPopulate = [
  { path: "vendorId", select: "name username email avatarUrl bio role" },
  { path: "categoryId", select: "name slug" },
];
export async function uniqueSlug(value: string, excludeId?: string) {
  const base = slugify(value);
  const exists = await Product.exists({
    slug: base,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  return exists ? `${base}-${Date.now().toString(36)}` : base;
}
export async function resolveCategory(name?: string) {
  if (!name) return null;
  const slug = slugify(name);
  return Category.findOneAndUpdate(
    { slug },
    { $set: { name } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}
export function parseProductBody(body: Record<string, unknown>) {
  return {
    ...body,
    tags:
      typeof body.tags === "string" ? JSON.parse(body.tags || "[]") : body.tags,
    images:
      typeof body.images === "string"
        ? JSON.parse(body.images || "[]")
        : body.images,
  };
}
