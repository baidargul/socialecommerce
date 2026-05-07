import { apiSuccess } from "@/lib/api/response";
import { demoPosts } from "@/lib/demo-data";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 20);

  return apiSuccess(
    {
      items: demoPosts.slice(0, limit),
      nextCursor: null,
    },
    startedAt,
    { cache: "demo" },
  );
}
