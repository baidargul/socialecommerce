"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { FeedPost, Product, Story } from "@/lib/types";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { ProductCard } from "@/components/product/product-card";
import { StoriesBar } from "@/components/stories/stories-bar";
import { SheetHost } from "@/components/sheets/sheet-host";
import { EmptyState } from "@/components/ui/empty-state";
import { useFeedStore } from "@/store/use-feed-store";
import { apiFetch } from "@/lib/api-url";

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
};

const refreshThreshold = 72;

export function HomeFeed({
  posts,
  products,
  stories,
}: {
  posts: FeedPost[];
  products: Product[];
  stories: Story[];
}) {
  const storePosts = useFeedStore((state) => state.posts);
  const hiddenPostIds = useFeedStore((state) => state.hiddenPostIds);
  const setPosts = useFeedStore((state) => state.setPosts);
  const [refreshedProducts, setRefreshedProducts] = useState<Product[] | null>(
    null,
  );
  const [refreshedStories, setRefreshedStories] = useState<Story[] | null>(
    null,
  );
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setPosts(posts);
  }, [posts, setPosts]);

  const visiblePosts = posts.filter((post) => !hiddenPostIds.includes(post.id));
  const postIds = visiblePosts.map((post) => post.id).join(",");
  const storePostIds = storePosts.map((post) => post.id).join(",");
  const renderedPosts = postIds === storePostIds ? storePosts : visiblePosts;
  const renderedProducts = refreshedProducts ?? products;
  const renderedStories = refreshedStories ?? stories;
  const timeline = useMemo(
    () =>
      [
        ...renderedPosts.map((post) => ({
          kind: "post" as const,
          key: `post-${post.id}`,
          createdAt: post.createdAt ?? "",
          post,
        })),
        ...renderedProducts.map((product) => ({
          kind: "product" as const,
          key: `product-${product.id}`,
          createdAt: product.createdAt ?? "",
          product,
        })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [renderedPosts, renderedProducts],
  );

  async function refreshTimeline() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    setPullDistance(refreshThreshold);
    try {
      const [postsResponse, productsResponse, storiesResponse] =
        await Promise.all([
          apiFetch("/api/v1/posts"),
          apiFetch("/api/v1/products"),
          apiFetch("/api/v1/stories"),
        ]);
      const [postsBody, productsBody, storiesBody] = (await Promise.all([
        postsResponse.json(),
        productsResponse.json(),
        storiesResponse.json(),
      ])) as [
        ApiEnvelope<{ items: FeedPost[] }>,
        ApiEnvelope<{ items: Product[] }>,
        ApiEnvelope<{ items: Story[] }>,
      ];
      if (
        !postsResponse.ok ||
        !productsResponse.ok ||
        !storiesResponse.ok ||
        !postsBody.success ||
        !productsBody.success ||
        !storiesBody.success ||
        !postsBody.data ||
        !productsBody.data ||
        !storiesBody.data
      )
        throw new Error("Refresh failed");
      setPosts(postsBody.data.items);
      setRefreshedProducts(productsBody.data.items);
      setRefreshedStories(storiesBody.data.items);
    } catch {
      setRefreshError("Could not refresh. Pull down to try again.");
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }

  const releaseToRefresh = pullDistance >= refreshThreshold;

  return (
    <div
      className="min-h-dvh overscroll-y-contain"
      onTouchStart={(event) => {
        if (refreshing || window.scrollY > 0) return;
        touchStartY.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(event) => {
        if (touchStartY.current === null || refreshing || window.scrollY > 0)
          return;
        const distance =
          (event.touches[0]?.clientY ?? touchStartY.current) -
          touchStartY.current;
        if (distance <= 0) {
          setPullDistance(0);
          return;
        }
        event.preventDefault();
        setPullDistance(Math.min(104, distance * 0.48));
      }}
      onTouchEnd={() => {
        touchStartY.current = null;
        if (releaseToRefresh) void refreshTimeline();
        else setPullDistance(0);
      }}
      onTouchCancel={() => {
        touchStartY.current = null;
        setPullDistance(0);
      }}
    >
      <div
        className="grid place-items-center overflow-hidden bg-zinc-50 text-zinc-500 transition-[height] duration-150"
        style={{ height: refreshing ? refreshThreshold : pullDistance }}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-xs font-black">
          <RefreshCw
            className={`size-5 ${refreshing ? "animate-spin text-[#d62976]" : releaseToRefresh ? "rotate-180 text-[#d62976]" : ""}`}
          />
          {refreshing
            ? "Getting latest posts and products..."
            : releaseToRefresh
              ? "Release to refresh"
              : "Pull to refresh"}
        </div>
      </div>
      {refreshError ? (
        <p className="bg-red-50 px-5 py-2 text-center text-xs font-bold text-red-700">
          {refreshError}
        </p>
      ) : null}
      <StoriesBar stories={renderedStories} />
      <div>
        {timeline.length ? (
          timeline.map((item) =>
            item.kind === "post" ? (
              <FeedPostCard key={item.key} post={item.post} />
            ) : (
              <section
                key={item.key}
                className="border-b border-zinc-100 px-5 py-5"
              >
                <p className="mb-3 text-sm font-black text-zinc-600">
                  New product
                  {item.product.vendorName
                    ? ` · @${item.product.vendorName}`
                    : ""}
                </p>
                <ProductCard
                  product={item.product}
                  onDeleted={(productId) =>
                    setRefreshedProducts((current) =>
                      (current ?? products).filter(
                        (product) => product.id !== productId,
                      ),
                    )
                  }
                />
              </section>
            ),
          )
        ) : (
          <EmptyState title="Nothing here yet">
            Latest posts and products will appear here.
          </EmptyState>
        )}
      </div>
      <SheetHost />
    </div>
  );
}
