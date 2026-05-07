import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(_request: Request, context: RouteContext<"/api/v1/posts/[id]/like">) {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to like posts.", startedAt, 401);

  const { id } = await context.params;
  return apiSuccess({ postId: id, liked: true }, startedAt, { cache: "demo" });
}
