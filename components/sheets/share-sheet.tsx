"use client";

import { Copy, MessageCircle, Send, X } from "lucide-react";
import { Sheet } from "@/components/sheets/sheet";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { demoUsers } from "@/lib/demo-data";
import { useFeedStore } from "@/store/use-feed-store";
import { useSheetStore } from "@/store/use-sheet-store";
import { apiFetch } from "@/lib/api-url";

export function ShareSheet({ open }: { open: boolean }) {
  const selectedPost = useSheetStore((state) => state.selectedPost);
  const closeSheet = useSheetStore((state) => state.closeSheet);
  const incrementShares = useFeedStore((state) => state.incrementShares);

  if (!selectedPost) return null;

  const shareText = `Check out this post by ${selectedPost.creator.username}: ${selectedPost.caption} ${selectedPost.hashtags.map((tag) => `#${tag}`).join(" ")}`;

  async function copyShareText() {
    await navigator.clipboard?.writeText(shareText);
    await persistShare();
  }

  async function persistShare() {
    const response = await apiFetch(`/api/v1/posts/${selectedPost!.id}/share`, {
      method: "POST",
    });
    if (response.ok) incrementShares(selectedPost!.id);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({
        title: "Social Commerce",
        text: shareText,
        url: `/post/${selectedPost!.slug}`,
      });
      await persistShare();
    } else {
      await copyShareText();
    }
  }

  return (
    <Sheet open={open} onClose={closeSheet} className="min-h-[54dvh] px-0">
      <div className="flex items-center justify-between px-8">
        <h2 className="text-4xl font-black">Sharing text</h2>
        <IconButton
          label="Close share sheet"
          icon={<X className="size-9" />}
          onClick={closeSheet}
        />
      </div>

      <div className="mx-8 mt-8 flex items-center gap-5 rounded-2xl bg-zinc-100 p-6">
        <p className="flex-1 text-3xl leading-tight">{shareText}</p>
        <IconButton
          label="Copy share text"
          icon={<Copy className="size-8" />}
          onClick={copyShareText}
        />
      </div>

      <div className="mt-8 border-y border-zinc-200 px-8 py-6">
        <div className="flex gap-8 overflow-x-auto">
          {demoUsers.slice(1, 4).map((user) => (
            <button
              key={user.id}
              className="grid w-24 shrink-0 justify-items-center gap-2 text-center text-lg leading-tight"
            >
              <Avatar src={user.avatarUrl} alt={user.username} size="md" />
              <span>{user.username.replace("_", " ")}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex gap-8 overflow-x-auto px-8">
        {[
          { label: "Quick Share", icon: Send, action: nativeShare },
          { label: "Copy link", icon: Copy, action: copyShareText },
          { label: "WhatsApp", icon: MessageCircle, action: nativeShare },
          { label: "Facebook", icon: Send, action: nativeShare },
        ].map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.label}
              className="grid w-24 shrink-0 justify-items-center gap-3 text-center text-lg"
              onClick={option.action}
            >
              <span className="grid size-16 place-items-center rounded-full bg-[#1586e8] text-white">
                <Icon className="size-9" />
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
