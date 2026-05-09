"use client";

import { useEffect } from "react";
import type { FeedPost, Story } from "@/lib/types";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { StoriesBar } from "@/components/stories/stories-bar";
import { SheetHost } from "@/components/sheets/sheet-host";
import { EmptyState } from "@/components/ui/empty-state";
import { useFeedStore } from "@/store/use-feed-store";

export function HomeFeed({ posts, stories }: { posts: FeedPost[]; stories: Story[] }) {
  const storePosts = useFeedStore((state) => state.posts);
  const setPosts = useFeedStore((state) => state.setPosts);

  useEffect(() => {
    setPosts(posts);
  }, [posts, setPosts]);

  const postIds = posts.map((post) => post.id).join(",");
  const storePostIds = storePosts.map((post) => post.id).join(",");
  const renderedPosts = postIds === storePostIds ? storePosts : posts;

  return (
    <>
      <StoriesBar stories={stories} />
      <div>
        {renderedPosts.length ? (
          renderedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
        ) : (
          <EmptyState title="No posts yet">Posts from your database will appear here.</EmptyState>
        )}
      </div>
      <SheetHost />
    </>
  );
}
