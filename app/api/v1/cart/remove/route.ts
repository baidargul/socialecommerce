import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function DELETE(request: Request) {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to update cart.", startedAt, 401);

  const { productId } = await request.json();
  if (!productId) return apiError("VALIDATION_ERROR", "Product is required.", startedAt, 422);

  return apiSuccess({ productId }, startedAt, { cache: "demo" });
}
