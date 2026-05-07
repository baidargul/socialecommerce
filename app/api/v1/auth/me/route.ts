import { apiSuccess } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const startedAt = Date.now();
  const user = await getSessionUser();
  return apiSuccess({ user }, startedAt);
}
