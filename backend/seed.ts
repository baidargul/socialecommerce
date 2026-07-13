import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  demoComments,
  demoPosts,
  demoProducts,
  demoUsers,
} from "../lib/demo-data";
import { connectDatabase, disconnectDatabase } from "./database/connection";
import { Category, Comment, Like, Post, Product, User } from "./models";
import { logger } from "./utils/logger";

async function seed() {
  if (!process.argv.includes("--reset"))
    throw new Error(
      "Seeding is destructive. Run `npm run db:seed -- --reset`.",
    );
  await connectDatabase();
  await Promise.all([
    Like.deleteMany({}),
    Comment.deleteMany({}),
    Post.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);
  const password = await bcrypt.hash("password123", 12);
  const users = new Map<string, string>();
  for (const source of demoUsers) {
    const user = await User.create({
      ...source,
      password,
      role: source.role,
      isVerified: true,
    });
    users.set(source.id, user.id);
  }
  const categories = new Map<string, string>();
  for (const name of new Set(demoProducts.map((item) => item.category))) {
    const item = await Category.create({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    });
    categories.set(name, item.id);
  }
  const products = new Map<string, string>();
  for (const source of demoProducts) {
    const product = await Product.create({
      ...source,
      vendorId: users.get(source.vendorId),
      categoryId: categories.get(source.category),
      status: source.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
    });
    products.set(source.id, product.id);
  }
  const posts = new Map<string, string>();
  for (const source of demoPosts) {
    const post = await Post.create({
      creatorId: users.get(source.creator.id),
      caption: source.caption,
      hashtags: source.hashtags,
      media: source.media,
      productId: source.product ? products.get(source.product.id) : undefined,
      slug: source.slug,
      likeCount: source.likeCount,
      commentCount: 0,
      shareCount: source.shareCount,
    });
    posts.set(source.id, post.id);
  }
  for (const source of demoComments) {
    const postId = posts.get(source.postId) ?? posts.values().next().value;
    const userId = users.get(source.user.id) ?? users.values().next().value;
    if (postId && userId) {
      await Comment.create({
        postId,
        userId,
        text: source.text,
        likeCount: source.likeCount,
      });
      await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
    }
  }
  logger.info(
    { users: users.size, products: products.size, posts: posts.size },
    "Database seeded",
  );
}
seed()
  .then(disconnectDatabase)
  .catch(async (error) => {
    logger.error({ err: error }, "Seed failed");
    await disconnectDatabase();
    process.exit(1);
  });
