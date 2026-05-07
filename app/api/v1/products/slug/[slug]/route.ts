import { apiError, apiSuccess } from "@/lib/api/response";
import { getDemoProductBySlug } from "@/lib/demo-data";

export async function GET(_request: Request, context: RouteContext<"/api/v1/products/slug/[slug]">) {
  const startedAt = Date.now();
  const { slug } = await context.params;
  const product = getDemoProductBySlug(slug);
  if (!product) return apiError("NOT_FOUND", "Product was not found.", startedAt, 404);

  return apiSuccess(product, startedAt, { cache: "demo" });
}
