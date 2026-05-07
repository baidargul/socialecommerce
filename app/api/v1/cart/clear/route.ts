import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST() {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to update cart.", startedAt, 401);

  return apiSuccess({ cleared: true }, startedAt, { cache: "demo" });
}
