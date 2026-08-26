import { HomeFeed } from "@/components/feed/home-feed";
import { MobileShell } from "@/components/layout/mobile-shell";
import { fetchBackend } from "@/lib/backend-api";
import type { FeedPost, Product, Story } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [postsResponse, productsResponse, storiesResponse] = await Promise.all([
    fetchBackend<{ items: FeedPost[]; nextCursor: null }>("/api/v1/posts"),
    fetchBackend<{ items: Product[]; nextCursor: null }>("/api/v1/products"),
    fetchBackend<{ items: Story[] }>("/api/v1/stories"),
  ]);
  const posts = postsResponse?.items ?? [];
  const products = productsResponse?.items ?? [];
  const stories = storiesResponse?.items ?? [];

  return (
    <MobileShell>
      <HomeFeed posts={posts} products={products} stories={stories} />
    </MobileShell>
  );
}
