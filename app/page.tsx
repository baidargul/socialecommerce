import { HomeFeed } from "@/components/feed/home-feed";
import { MobileShell } from "@/components/layout/mobile-shell";
import { demoPosts, demoStories } from "@/lib/demo-data";
import { getDatabaseFeed } from "@/lib/db-data";

export default async function HomePage() {
  const databaseFeed = await getDatabaseFeed();
  const posts = databaseFeed?.posts ?? demoPosts;
  const stories = databaseFeed?.stories ?? demoStories;

  return (
    <MobileShell>
      <HomeFeed posts={posts} stories={stories} />
    </MobileShell>
  );
}
