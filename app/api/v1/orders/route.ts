import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { orderSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to create an order.", startedAt, 401);

  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Shipping address and payment method are required.", startedAt, 422);

  return apiSuccess(
    {
      id: crypto.randomUUID(),
      userId: user.id,
      status: "PENDING",
      paymentMethod: parsed.data.paymentMethod,
      shippingAddress: parsed.data.shippingAddress,
    },
    startedAt,
    { cache: "demo" },
  );
}
