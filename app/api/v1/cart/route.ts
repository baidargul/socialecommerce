import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to view your cart.", startedAt, 401);

  return apiSuccess({ items: [] }, startedAt, { cache: "demo" });
}
