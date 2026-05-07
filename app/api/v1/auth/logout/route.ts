import { apiSuccess } from "@/lib/api/response";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  const startedAt = Date.now();
  await clearSession();
  return apiSuccess({ loggedOut: true }, startedAt);
}
