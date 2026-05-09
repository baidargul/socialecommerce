import { HomeFeed } from "@/components/feed/home-feed";
import { MobileShell } from "@/components/layout/mobile-shell";
import { fetchBackend } from "@/lib/backend-api";
import type { FeedPost, Story } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [postsResponse, storiesResponse] = await Promise.all([
    fetchBackend<{ items: FeedPost[]; nextCursor: null }>("/api/v1/posts"),
    fetchBackend<{ items: Story[] }>("/api/v1/stories"),
  ]);
  const posts = postsResponse?.items ?? [];
  const stories = storiesResponse?.items ?? [];

  return (
    <MobileShell>
      <HomeFeed posts={posts} stories={stories} />
    </MobileShell>
  );
}
