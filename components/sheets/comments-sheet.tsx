"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Sheet } from "@/components/sheets/sheet";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { demoComments, demoUsers } from "@/lib/demo-data";
import type { CommentItem } from "@/lib/types";
import { useFeedStore } from "@/store/use-feed-store";
import { useSheetStore } from "@/store/use-sheet-store";

const reactions = ["❤️", "🙌", "🔥", "👏", "🥲", "😍", "😮", "😂"];

export function CommentsSheet({ open }: { open: boolean }) {
  const { user, isAuthenticated, requireAuth } = useAuthGuard();
  const selectedPost = useSheetStore((state) => state.selectedPost);
  const closeSheet = useSheetStore((state) => state.closeSheet);
  const incrementComments = useFeedStore((state) => state.incrementComments);
  const [text, setText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>(demoComments);

  if (!selectedPost) return null;

  const visibleComments = comments.filter((comment) => comment.postId === selectedPost.id || selectedPost.id === "post-cozy");

  function addComment() {
    if (!requireAuth()) return;
    const trimmed = text.trim();
    if (!trimmed || !selectedPost) return;
    setComments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        postId: selectedPost.id,
        user: user ? { ...demoUsers[5], ...user } : demoUsers[5],
        text: trimmed,
        likeCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText("");
    incrementComments(selectedPost.id);
  }

  return (
    <Sheet open={open} onClose={closeSheet} className="min-h-[48dvh]">
      <h2 className="mb-7 text-4xl font-black">Comments</h2>
      <div className="grid max-h-[32dvh] gap-5 overflow-y-auto pr-1">
        {visibleComments.length ? (
          visibleComments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar src={comment.user.avatarUrl} alt={comment.user.username} size="sm" />
              <div>
                <p className="text-xl font-black">{comment.user.username}</p>
                <p className="text-2xl text-zinc-700">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-lg font-medium text-zinc-500">No comments yet.</p>
        )}
      </div>
      <div className="my-6 h-px bg-zinc-200" />
      <div className="mb-4 flex justify-between text-3xl">
        {reactions.map((reaction) => (
          <button key={reaction} className="rounded-full p-1">
            {reaction}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Avatar src={demoUsers[5].avatarUrl} alt={demoUsers[5].username} size="sm" />
        <div className="flex min-h-12 flex-1 items-center rounded-full border border-zinc-200 px-4">
          <input
            className="w-full bg-transparent text-xl outline-none placeholder:text-zinc-300"
            placeholder={isAuthenticated ? "Add a comment..." : "Login to comment..."}
            value={text}
            readOnly={!isAuthenticated}
            onFocus={() => {
              if (!isAuthenticated) requireAuth();
            }}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addComment();
            }}
          />
          <IconButton label="Add comment" icon={<Send className="size-5" />} onClick={addComment} />
        </div>
      </div>
    </Sheet>
  );
}
