"use client";

import { useEffect } from "react";
import type { FeedPost, Story } from "@/lib/types";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { StoriesBar } from "@/components/stories/stories-bar";
import { SheetHost } from "@/components/sheets/sheet-host";
import { useFeedStore } from "@/store/use-feed-store";

export function HomeFeed({ posts, stories }: { posts: FeedPost[]; stories: Story[] }) {
  const storePosts = useFeedStore((state) => state.posts);
  const setPosts = useFeedStore((state) => state.setPosts);

  useEffect(() => {
    setPosts(posts);
  }, [posts, setPosts]);

  const renderedPosts = storePosts.length ? storePosts : posts;

  return (
    <>
      <StoriesBar stories={stories} />
      <div>
        {renderedPosts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
      <SheetHost />
    </>
  );
}
