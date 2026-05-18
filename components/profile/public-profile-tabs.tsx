"use client";

import { useState } from "react";
import type { FeedPost, Product } from "@/lib/types";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type PublicProfileTabsProps = {
  posts: FeedPost[];
  products: Product[];
  initialTab?: "posts" | "products";
};

export function PublicProfileTabs({ posts, products, initialTab }: PublicProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "products">(initialTab ?? (posts.length ? "posts" : "products"));
  const tabs = [
    { key: "posts" as const, label: "Posts", count: posts.length },
    { key: "products" as const, label: "Products", count: products.length },
  ];

  return (
    <section className="border-t border-zinc-100">
      <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-zinc-100 bg-white/95 backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              "min-h-12 border-b-2 px-4 text-sm font-black transition",
              activeTab === tab.key ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500",
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} <span className="text-zinc-400">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === "posts" ? (
        posts.length ? (
          <div>
            {posts.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="No posts yet">Posts from this profile will appear here.</EmptyState>
        )
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-3 px-5 py-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title="No products yet">Products from this profile will appear here.</EmptyState>
      )}
    </section>
  );
}
