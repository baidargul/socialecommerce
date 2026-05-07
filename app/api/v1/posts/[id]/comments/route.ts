import { getSessionUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { demoComments, demoUsers } from "@/lib/demo-data";
import { commentSchema } from "@/lib/validation/schemas";

export async function GET(_request: Request, context: RouteContext<"/api/v1/posts/[id]/comments">) {
  const startedAt = Date.now();
  const { id } = await context.params;
  return apiSuccess({ items: demoComments.filter((comment) => comment.postId === id || id === "post-cozy"), nextCursor: null }, startedAt, { cache: "demo" });
}

export async function POST(request: Request, context: RouteContext<"/api/v1/posts/[id]/comments">) {
  const startedAt = Date.now();
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Login is required to comment.", startedAt, 401);

  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Comment text is required.", startedAt, 422);

  const { id } = await context.params;
  return apiSuccess(
    {
      id: crypto.randomUUID(),
      postId: id,
      user: { ...demoUsers[5], ...user },
      text: parsed.data.text,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    },
    startedAt,
  );
}
