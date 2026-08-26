"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/product/product-card";
import { apiFetch } from "@/lib/api-url";
import type { DemoUser, FeedPost, Product } from "@/lib/types";

type SearchTab = "all" | "posts" | "products" | "users";
type SearchResults = {
  posts: FeedPost[];
  products: Product[];
  users: DemoUser[];
};

const emptyResults: SearchResults = { posts: [], products: [], users: [] };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch(
          `/api/v1/search?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as {
          success: boolean;
          data: SearchResults;
          error?: { message?: string } | null;
        };
        if (!response.ok || !body.success)
          throw new Error(body.error?.message || "Search failed.");
        setResults(body.data);
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setResults(emptyResults);
        setError(
          searchError instanceof Error
            ? searchError.message
            : "Search failed. Try again.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const total =
    results.posts.length + results.products.length + results.users.length;
  const tabs: { id: SearchTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "posts", label: "Posts", count: results.posts.length },
    { id: "products", label: "Products", count: results.products.length },
    { id: "users", label: "Users", count: results.users.length },
  ];

  function changeQuery(value: string) {
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
      return;
    }
    setResults(emptyResults);
    setLoading(false);
    setError("");
  }

  const hasQuery = Boolean(query.trim());
  const activeCount = activeTab === "all" ? total : results[activeTab].length;

  return (
    <div className="px-5 py-6">
      <h1 className="text-4xl font-black">Search</h1>
      <p className="mt-1 text-sm font-medium text-zinc-500">
        Find posts, products and people.
      </p>

      <label className="relative mt-5 block" htmlFor="global-search">
        <span className="sr-only">Search posts, products and users</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          placeholder="Search anything..."
          autoComplete="off"
          className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-12 text-base font-medium outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
        />
        {query ? (
          <button
            type="button"
            onClick={() => changeQuery("")}
            className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-zinc-500"
            aria-label="Clear search"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </label>

      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              activeTab === tab.id
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {tab.label}
            {hasQuery && !loading ? ` ${tab.count}` : ""}
          </button>
        ))}
      </div>

      {!hasQuery ? (
        <EmptyState title="Search anything">
          Try a product, hashtag, post or username.
        </EmptyState>
      ) : loading ? (
        <SearchSkeleton />
      ) : error ? (
        <EmptyState title="Could not search">{error}</EmptyState>
      ) : activeCount === 0 ? (
        <EmptyState
          title={`No ${activeTab === "all" ? "results" : activeTab} found`}
        >
          Try another word or check the spelling.
        </EmptyState>
      ) : (
        <div className="mt-6 space-y-8">
          {(activeTab === "all" || activeTab === "users") &&
          results.users.length ? (
            <SearchSection
              title="People"
              count={results.users.length}
              onSeeAll={
                activeTab === "all" ? () => setActiveTab("users") : undefined
              }
            >
              <div className="space-y-2">
                {results.users.map((user) => (
                  <UserResult key={user.id} user={user} />
                ))}
              </div>
            </SearchSection>
          ) : null}

          {(activeTab === "all" || activeTab === "posts") &&
          results.posts.length ? (
            <SearchSection
              title="Posts"
              count={results.posts.length}
              onSeeAll={
                activeTab === "all" ? () => setActiveTab("posts") : undefined
              }
            >
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <PostResult key={post.id} post={post} />
                ))}
              </div>
            </SearchSection>
          ) : null}

          {(activeTab === "all" || activeTab === "products") &&
          results.products.length ? (
            <SearchSection
              title="Products"
              count={results.products.length}
              onSeeAll={
                activeTab === "all" ? () => setActiveTab("products") : undefined
              }
            >
              <div className="grid grid-cols-2 gap-3">
                {results.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </SearchSection>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  count,
  onSeeAll,
  children,
}: {
  title: string;
  count: number;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black">
          {title} <span className="text-zinc-400">{count}</span>
        </h2>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-sm font-black text-[#d62976]"
          >
            See all
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function UserResult({ user }: { user: DemoUser }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-3"
    >
      <Avatar src={user.avatarUrl} alt={user.username} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{user.name}</p>
        <p className="truncate text-sm font-medium text-zinc-500">
          @{user.username}
        </p>
        {user.bio ? (
          <p className="mt-1 line-clamp-1 text-sm text-zinc-600">{user.bio}</p>
        ) : null}
      </div>
      <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black text-zinc-500">
        {user.role}
      </span>
    </Link>
  );
}

function PostResult({ post }: { post: FeedPost }) {
  const media = post.media[0];
  return (
    <Link
      href={`/post/${post.slug}`}
      className="flex min-h-24 overflow-hidden rounded-2xl border border-zinc-100 bg-white"
    >
      {media ? (
        <div className="relative w-24 shrink-0 bg-zinc-100">
          {media.type === "video" ? (
            <video
              src={media.url}
              muted
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <Image
              src={media.url}
              alt={post.caption}
              fill
              sizes="96px"
              className="object-cover"
            />
          )}
        </div>
      ) : null}
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-center gap-2">
          <Avatar
            src={post.creator.avatarUrl}
            alt={post.creator.username}
            size="sm"
          />
          <p className="truncate text-sm font-black">
            @{post.creator.username}
          </p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-snug text-zinc-700">
          {post.caption}
        </p>
      </div>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="mt-7 space-y-3" aria-label="Searching">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-2xl bg-zinc-100"
        />
      ))}
    </div>
  );
}
