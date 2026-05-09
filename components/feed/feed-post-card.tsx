"use client";

import Image from "next/image";
import { Heart, MessageCircle, MoreHorizontal, Send, ShoppingBag } from "lucide-react";
import type { FeedPost } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { FeaturedProduct } from "@/components/feed/featured-product";
import { useFeedStore } from "@/store/use-feed-store";
import { useSheetStore } from "@/store/use-sheet-store";

export function FeedPostCard({ post }: { post: FeedPost }) {
  const { requireAuth } = useAuthGuard();
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const openComments = useSheetStore((state) => state.openComments);
  const openCheckout = useSheetStore((state) => state.openCheckout);
  const openShare = useSheetStore((state) => state.openShare);
  const media = post.media[0];

  return (
    <article className="border-b border-zinc-100 pb-10">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.creator.avatarUrl} alt={post.creator.username} size="sm" />
          <p className="text-[18px] font-black">{post.creator.username}</p>
        </div>
        <IconButton label="Post options" icon={<MoreHorizontal className="size-6" />} />
      </header>

      <div className="relative aspect-square bg-zinc-100">
        {media ? <Image src={media.url} alt={post.caption} fill sizes="430px" className="object-cover" /> : null}
        {post.media.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {post.media.map((media) => (
              <span key={media.url} className="size-2 rounded-full bg-white" />
            ))}
          </div>
        ) : (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            <span className="size-2 rounded-full bg-white" />
            <span className="size-2 rounded-full bg-white/70" />
          </div>
        )}
        {post.product ? (
          <Button
            className="absolute bottom-4 right-4 min-h-9 rounded-lg bg-white px-3 text-sm text-zinc-950 shadow"
            icon={<ShoppingBag className="size-5" />}
            onClick={() => {
              if (!requireAuth()) return;
              openCheckout(post.product!, post);
            }}
          >
            Buy Now
          </Button>
        ) : null}
      </div>

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
          {post.hashtags.map((tag) => (
            <span key={tag}>#{tag} </span>
          ))}
        </p>

        {post.product ? <FeaturedProduct product={post.product} /> : null}
      </div>
    </article>
  );
}
