import { apiSuccess } from "@/lib/api/response";
import { demoStories } from "@/lib/demo-data";

export async function GET() {
  const startedAt = Date.now();
  return apiSuccess({ items: demoStories }, startedAt, { cache: "demo" });
}
