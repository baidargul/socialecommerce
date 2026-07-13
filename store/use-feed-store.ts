"use client";

import { create } from "zustand";
import type { FeedPost } from "@/lib/types";

type FeedState = {
  posts: FeedPost[];
  setPosts: (posts: FeedPost[]) => void;
  toggleLike: (postId: string) => void;
  incrementComments: (postId: string) => void;
  incrementShares: (postId: string) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.likeCount + (post.isLiked ? -1 : 1),
            }
          : post,
      ),
    })),
  incrementComments: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, commentCount: post.commentCount + 1 }
          : post,
      ),
    })),
  incrementShares: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, shareCount: post.shareCount + 1 }
          : post,
      ),
    })),
}));
