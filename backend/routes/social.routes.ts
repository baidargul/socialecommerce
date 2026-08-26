/* eslint-disable @typescript-eslint/no-explicit-any -- populated social documents are normalized at this HTTP boundary. */
import { Router } from "express";
import { commentSchema } from "../../lib/validation/schemas";
import { Comment, Follow, Like, Post, Product, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { productPopulate } from "../services/catalog.service";
import { AppError, stringId, success } from "../utils/http";
import { mapPost, mapProduct, mapUser } from "../utils/mappers";

export const socialRouter = Router();
const postPopulate = [
  { path: "creatorId" },
  { path: "productId", populate: productPopulate },
];
socialRouter.get("/posts", async (req, res) => {
  const posts = await Post.find({ status: "PUBLISHED" })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate(postPopulate);
  if (req.authUser) {
    const liked = new Set(
      (
        await Like.find({
          userId: req.authUser.id,
          postId: { $in: posts.map((p) => p._id) },
        }).select("postId")
      ).map((item) => stringId(item.postId)),
    );
    posts.forEach((post: any) => {
      post.isLiked = liked.has(stringId(post._id));
    });
  }
  return success(req, res, { items: posts.map(mapPost), nextCursor: null });
});
socialRouter.get("/posts/slug/:slug", async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    postPopulate,
  );
  if (!post) throw new AppError(404, "NOT_FOUND", "Post was not found.");
  return success(req, res, mapPost(post));
});
socialRouter.get("/stories", async (req, res) => {
  const posts = await Post.find({
    status: "PUBLISHED",
    "media.0": { $exists: true },
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .populate(postPopulate);
  return success(req, res, {
    items: posts.map((post: any) => ({
      id: `story-${post.id}`,
      creator: mapUser(post.creatorId),
      mediaUrl: post.media[0]?.url ?? "",
      viewed: false,
      product: post.productId ? mapProduct(post.productId) : undefined,
    })),
  });
});
socialRouter.get("/posts/:id/comments", async (req, res) => {
  const comments = await Comment.find({
    postId: req.params.id,
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .populate("userId");
  return success(req, res, {
    items: comments.map((comment: any) => ({
      id: comment.id,
      postId: stringId(comment.postId),
      user: mapUser(comment.userId),
      text: comment.text,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt.toISOString(),
    })),
    nextCursor: null,
  });
});
socialRouter.post("/posts/:id/comments", requireAuth, async (req, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(422, "VALIDATION_ERROR", "Comment text is required.");
  if (!(await Post.exists({ _id: req.params.id })))
    throw new AppError(404, "NOT_FOUND", "Post was not found.");
  const comment = await Comment.create({
    postId: req.params.id,
    userId: req.authUser!.id,
    text: parsed.data.text,
  });
  await Post.updateOne({ _id: req.params.id }, { $inc: { commentCount: 1 } });
  await comment.populate("userId");
  return success(
    req,
    res,
    {
      id: comment.id,
      postId: req.params.id,
      user: mapUser(comment.userId),
      text: comment.text,
      likeCount: 0,
      createdAt: comment.createdAt.toISOString(),
    },
    201,
  );
});
socialRouter.post("/posts/:id/like", requireAuth, async (req, res) => {
  if (!(await Post.exists({ _id: req.params.id })))
    throw new AppError(404, "NOT_FOUND", "Post was not found.");
  const existing = await Like.findOneAndDelete({
    postId: req.params.id,
    userId: req.authUser!.id,
  });
  let liked = false;
  if (existing)
    await Post.updateOne({ _id: req.params.id }, { $inc: { likeCount: -1 } });
  else {
    await Like.create({ postId: req.params.id, userId: req.authUser!.id });
    await Post.updateOne({ _id: req.params.id }, { $inc: { likeCount: 1 } });
    liked = true;
  }
  const post = await Post.findById(req.params.id);
  return success(req, res, {
    postId: req.params.id,
    liked,
    likeCount: Math.max(0, post?.likeCount ?? 0),
  });
});
socialRouter.post("/posts/:id/share", async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { shareCount: 1 } },
    { returnDocument: "after" },
  );
  if (!post) throw new AppError(404, "NOT_FOUND", "Post was not found.");
  return success(req, res, {
    postId: req.params.id,
    shared: true,
    shareCount: post.shareCount,
  });
});
socialRouter.get("/profiles/:username", async (req, res) => {
  const user = await User.findOne({
    username: String(req.params.username).toLowerCase(),
  });
  if (!user) throw new AppError(404, "NOT_FOUND", "Profile was not found.");
  const [followerCount, followingCount, products, posts, followed] =
    await Promise.all([
      Follow.countDocuments({ followingId: user.id }),
      Follow.countDocuments({ followerId: user.id }),
      Product.find({ vendorId: user.id }).populate(productPopulate),
      Post.find({ creatorId: user.id }).populate(postPopulate),
      req.authUser
        ? Follow.exists({ followerId: req.authUser.id, followingId: user.id })
        : null,
    ]);
  return success(req, res, {
    user: mapUser(user),
    stats: {
      posts: posts.length,
      products: products.length,
      followers: followerCount,
      following: followingCount,
    },
    followerCount,
    followingCount,
    isFollowing: Boolean(followed),
    posts: posts.map(mapPost),
    products: products.map(mapProduct),
  });
});
socialRouter.post(
  "/profiles/:username/follow",
  requireAuth,
  async (req, res) => {
    const target = await User.findOne({
      username: String(req.params.username).toLowerCase(),
    });
    if (!target) throw new AppError(404, "NOT_FOUND", "Profile was not found.");
    if (target.id === req.authUser!.id)
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "You cannot follow yourself.",
      );
    await Follow.updateOne(
      { followerId: req.authUser!.id, followingId: target.id },
      {
        $setOnInsert: { followerId: req.authUser!.id, followingId: target.id },
      },
      { upsert: true },
    );
    return success(req, res, {
      following: true,
      followerCount: await Follow.countDocuments({ followingId: target.id }),
    });
  },
);
socialRouter.delete(
  "/profiles/:username/follow",
  requireAuth,
  async (req, res) => {
    const target = await User.findOne({
      username: String(req.params.username).toLowerCase(),
    });
    if (!target) throw new AppError(404, "NOT_FOUND", "Profile was not found.");
    await Follow.deleteOne({
      followerId: req.authUser!.id,
      followingId: target.id,
    });
    return success(req, res, {
      following: false,
      followerCount: await Follow.countDocuments({ followingId: target.id }),
    });
  },
);
