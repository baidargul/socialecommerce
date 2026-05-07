import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { cartQuantitySchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request) {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to update cart.", startedAt, 401);

  const parsed = cartQuantitySchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Product and quantity are required.", startedAt, 422);

  return apiSuccess({ item: parsed.data }, startedAt, { cache: "demo" });
}
