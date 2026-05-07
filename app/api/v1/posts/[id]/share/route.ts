import { apiSuccess } from "@/lib/api/response";

export async function POST(_request: Request, context: RouteContext<"/api/v1/posts/[id]/share">) {
  const startedAt = Date.now();
  const { id } = await context.params;
  return apiSuccess({ postId: id, shared: true }, startedAt, { cache: "demo" });
}
