"use client";

import { create } from "zustand";
import type { FeedPost } from "@/lib/types";

type FeedState = {
  posts: FeedPost[];
  hiddenPostIds: string[];
  setPosts: (posts: FeedPost[]) => void;
  removePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  incrementComments: (postId: string) => void;
  incrementShares: (postId: string) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  hiddenPostIds: [],
  setPosts: (posts) =>
    set((state) => ({
      posts,
      hiddenPostIds: state.hiddenPostIds.filter((postId) =>
        posts.some((post) => post.id === postId),
      ),
    })),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
      hiddenPostIds: state.hiddenPostIds.includes(postId)
        ? state.hiddenPostIds
        : [...state.hiddenPostIds, postId],
    })),
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
