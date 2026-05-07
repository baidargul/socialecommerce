import { apiError, apiSuccess } from "@/lib/api/response";
import { demoProducts } from "@/lib/demo-data";

export async function GET(_request: Request, context: RouteContext<"/api/v1/products/[id]">) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const product = demoProducts.find((item) => item.id === id);
  if (!product) return apiError("NOT_FOUND", "Product was not found.", startedAt, 404);

  return apiSuccess(product, startedAt, { cache: "demo" });
}
