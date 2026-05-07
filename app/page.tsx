import { HomeFeed } from "@/components/feed/home-feed";
import { MobileShell } from "@/components/layout/mobile-shell";
import { demoPosts, demoStories } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <MobileShell>
      <HomeFeed posts={demoPosts} stories={demoStories} />
    </MobileShell>
  );
}
