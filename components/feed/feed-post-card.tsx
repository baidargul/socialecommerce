"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShoppingBag,
  Trash2,
} from "lucide-react";
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
import { apiFetch } from "@/lib/api-url";
import { useAuthStore } from "@/store/use-auth-store";

export function FeedPostCard({
  post,
  onDeleted,
}: {
  post: FeedPost;
  onDeleted?: (postId: string) => void;
}) {
  const router = useRouter();
  const { requireAuth } = useAuthGuard();
  const user = useAuthStore((state) => state.user);
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const removePost = useFeedStore((state) => state.removePost);
  const openComments = useSheetStore((state) => state.openComments);
  const openCheckout = useSheetStore((state) => state.openCheckout);
  const openShare = useSheetStore((state) => state.openShare);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isOwner = user?.id === post.creator.id;

  async function deletePost() {
    if (deleting || !isOwner) return;
    if (!window.confirm("Delete this post permanently?")) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await apiFetch(`/api/v1/posts/${post.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as {
        success: boolean;
        error: { message: string } | null;
      };
      if (!response.ok || !body.success) {
        setDeleteError(body.error?.message ?? "Post could not be deleted.");
        return;
      }
      setOptionsOpen(false);
      removePost(post.id);
      onDeleted?.(post.id);
      router.refresh();
    } catch {
      setDeleteError("Could not reach the post service.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="border-b border-zinc-100 pb-10">
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href={`/profile/${post.creator.username}`}
          className="flex items-center gap-3"
        >
          <Avatar
            src={post.creator.avatarUrl}
            alt={post.creator.username}
            size="sm"
          />
          <p className="text-[18px] font-black">{post.creator.username}</p>
        </Link>
        <div className="relative">
          <IconButton
            label="Post options"
            aria-expanded={optionsOpen}
            aria-haspopup="menu"
            icon={<MoreHorizontal className="size-6" />}
            onClick={() => {
              setDeleteError("");
              setOptionsOpen((current) => !current);
            }}
          />
          {optionsOpen ? (
            <>
              <button
                type="button"
                aria-label="Close post options"
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setOptionsOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOptionsOpen(false);
                    openShare(post);
                  }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-zinc-800 active:bg-zinc-100"
                >
                  <Send className="size-4" /> Share post
                </button>
                {isOwner ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={deleting}
                    onClick={() => void deletePost()}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-red-600 active:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    {deleting ? "Deleting..." : "Delete post"}
                  </button>
                ) : null}
                {deleteError ? (
                  <p className="px-3 py-2 text-xs font-bold text-red-600">
                    {deleteError}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
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
            onClick={async () => {
              if (!requireAuth()) return;
              const response = await apiFetch(`/api/v1/posts/${post.id}/like`, {
                method: "POST",
              });
              if (!response.ok) return;
              toggleLike(post.id);
            }}
          >
            <Heart
              className="size-8"
              fill={post.isLiked ? "currentColor" : "none"}
            />
            {formatCompactNumber(post.likeCount)}
          </button>
          <button
            className="flex items-center gap-2 text-[17px] font-black"
            onClick={() => openComments(post)}
          >
            <MessageCircle className="size-8" />
            {formatCompactNumber(post.commentCount)}
          </button>
          <IconButton
            label="Share post"
            icon={<Send className="size-8" />}
            onClick={() => openShare(post)}
          />
        </div>

        <p className="mt-3 text-[17px] leading-snug">
          <Link
            href={`/profile/${post.creator.username}`}
            className="font-black"
          >
            {post.creator.username}
          </Link>{" "}
          {post.caption}{" "}
          {post.hashtags.map((tag) =>
            tag ? <span key={tag}>#{tag} </span> : null,
          )}
        </p>

        {post.product ? <FeaturedProduct product={post.product} /> : null}
      </div>
    </article>
  );
}
