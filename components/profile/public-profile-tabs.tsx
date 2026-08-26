"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CategoryItem, FeedPost, Product } from "@/lib/types";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PostCreateWizard } from "@/components/profile/post-create-wizard";
import { ProductCreateWizard } from "@/components/profile/product-create-wizard";
import { cn } from "@/lib/utils";

type PublicProfileTabsProps = {
  posts: FeedPost[];
  products: Product[];
  categories?: CategoryItem[];
  isOwner?: boolean;
  canCreateProducts?: boolean;
  initialTab?: "posts" | "products";
};

export function PublicProfileTabs({
  posts,
  products,
  categories = [],
  isOwner = false,
  canCreateProducts = false,
  initialTab,
}: PublicProfileTabsProps) {
  const [profilePosts, setProfilePosts] = useState(posts);
  const [profileProducts, setProfileProducts] = useState(products);
  const [activeTab, setActiveTab] = useState<"posts" | "products">(
    initialTab ?? (posts.length ? "posts" : "products"),
  );
  const [wizard, setWizard] = useState<"post" | "product" | null>(null);
  const reduceMotion = useReducedMotion();

  const tabs = [
    { key: "posts" as const, label: "Posts", count: profilePosts.length },
    {
      key: "products" as const,
      label: "Products",
      count: profileProducts.length,
    },
  ];
  const canCreateActive =
    isOwner && (activeTab === "posts" || canCreateProducts);

  return (
    <section className="border-t border-zinc-100">
      <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-zinc-100 bg-white/95 backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              "relative min-h-12 px-4 text-sm font-black transition-colors duration-150",
              activeTab === tab.key ? "text-zinc-950" : "text-zinc-500",
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} <span className="text-zinc-400">{tab.count}</span>
            {activeTab === tab.key ? (
              <motion.span
                layoutId="profile-tab-indicator"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-950"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 520, damping: 42 }
                }
              />
            ) : null}
          </button>
        ))}
      </div>

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeTab}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -6 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.16, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {activeTab === "posts" ? (
            profilePosts.length ? (
              <div>
                {profilePosts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    onDeleted={(postId) =>
                      setProfilePosts((current) =>
                        current.filter((item) => item.id !== postId),
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No posts yet">
                Posts from this profile will appear here.
              </EmptyState>
            )
          ) : profileProducts.length ? (
            <div className="grid grid-cols-2 gap-3 px-5 py-5">
              {profileProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDeleted={(productId) =>
                    setProfileProducts((current) =>
                      current.filter((item) => item.id !== productId),
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No products yet">
              Products from this profile will appear here.
            </EmptyState>
          )}
        </motion.div>
      </AnimatePresence>

      {canCreateActive ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-[430px] justify-end px-5">
          <button
            type="button"
            onClick={() =>
              setWizard(activeTab === "posts" ? "post" : "product")
            }
            className="pointer-events-auto grid size-14 place-items-center rounded-full bg-[#d62976] text-white shadow-[0_10px_30px_rgba(214,41,118,0.4)] transition active:scale-95"
            aria-label={
              activeTab === "posts" ? "Add new post" : "Add new product"
            }
            title={activeTab === "posts" ? "Add new post" : "Add new product"}
          >
            <Plus className="size-6" />
          </button>
        </div>
      ) : null}

      {wizard === "post" ? (
        <PostCreateWizard
          products={profileProducts}
          onClose={() => setWizard(null)}
          onCreated={(post) => setProfilePosts((current) => [post, ...current])}
        />
      ) : null}
      {wizard === "product" ? (
        <ProductCreateWizard
          categories={categories}
          onClose={() => setWizard(null)}
          onCreated={(product) =>
            setProfileProducts((current) => [product, ...current])
          }
        />
      ) : null}
    </section>
  );
}
