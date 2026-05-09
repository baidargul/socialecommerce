import { apiSuccess } from "@/lib/api/response";
import { demoPosts } from "@/lib/demo-data";
import { getDatabaseFeed } from "@/lib/db-data";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 20);
  const databaseFeed = await getDatabaseFeed(limit);
  if (databaseFeed) return apiSuccess({ items: databaseFeed.posts, nextCursor: null }, startedAt);

  return apiSuccess(
    {
      items: demoPosts.slice(0, limit),
      nextCursor: null,
    },
    startedAt,
    { cache: "demo" },
  );
}
