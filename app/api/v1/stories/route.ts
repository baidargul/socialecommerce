import { apiSuccess } from "@/lib/api/response";
import { demoStories } from "@/lib/demo-data";
import { getDatabaseFeed } from "@/lib/db-data";

export async function GET() {
  const startedAt = Date.now();
  const databaseFeed = await getDatabaseFeed();
  if (databaseFeed) return apiSuccess({ items: databaseFeed.stories }, startedAt);

  return apiSuccess({ items: demoStories }, startedAt, { cache: "demo" });
}
