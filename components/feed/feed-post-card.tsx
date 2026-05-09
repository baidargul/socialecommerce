"use client";

import { Heart, MessageCircle, MoreHorizontal, Send, ShoppingBag } from "lucide-react";
import type { FeedPost } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { FeaturedProduct } from "@/components/feed/featured-product";
import { ProductMediaCarousel } from "@/components/feed/product-media-carousel";
import { useFeedStore } from "@/store/use-feed-store";
import { useSheetStore } from "@/store/use-sheet-store";

export function FeedPostCard({ post }: { post: FeedPost }) {
  const { requireAuth } = useAuthGuard();
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const openComments = useSheetStore((state) => state.openComments);
  const openCheckout = useSheetStore((state) => state.openCheckout);
  const openShare = useSheetStore((state) => state.openShare);

  return (
    <article className="border-b border-zinc-100 pb-10">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.creator.avatarUrl} alt={post.creator.username} size="sm" />
          <p className="text-[18px] font-black">{post.creator.username}</p>
        </div>
        <IconButton label="Post options" icon={<MoreHorizontal className="size-6" />} />
      </header>

      <ProductMediaCarousel key={post.id} media={post.media} alt={post.caption}>
        {post.product ? (
          <Button
            className="pointer-events-auto absolute bottom-4 right-4 min-h-9 rounded-lg bg-white px-3 text-sm text-zinc-950 shadow"
            icon={<ShoppingBag className="size-5" />}
            onClick={() => {
              if (!requireAuth()) return;
              openCheckout(post.product!, post);
            }}
          >
            Buy Now
          </Button>
        ) : null}
      </ProductMediaCarousel>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-[17px] font-black"
            onClick={() => {
              if (!requireAuth()) return;
              toggleLike(post.id);
            }}
          >
            <Heart className="size-8" fill={post.isLiked ? "currentColor" : "none"} />
            {formatCompactNumber(post.likeCount)}
          </button>
          <button className="flex items-center gap-2 text-[17px] font-black" onClick={() => openComments(post)}>
            <MessageCircle className="size-8" />
            {formatCompactNumber(post.commentCount)}
          </button>
          <IconButton label="Share post" icon={<Send className="size-8" />} onClick={() => openShare(post)} />
        </div>

        <p className="mt-3 text-[17px] leading-snug">
          <span className="font-black">{post.creator.username}</span> {post.caption}{" "}
          {post.hashtags.map((tag) => (tag ? <span key={tag}>#{tag} </span> : null))}
        </p>

        {post.product ? <FeaturedProduct product={post.product} /> : null}
      </div>
    </article>
  );
}
