import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { demoComments, demoPosts, demoProducts, demoUsers } from "../lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const users = new Map<string, string>();
  for (const user of demoUsers) {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        username: user.username,
        email: user.email,
        password,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        isVerified: true,
      },
    });
    users.set(user.id, created.id);
  }

  const categories = new Map<string, string>();
  for (const name of [...new Set(demoProducts.map((product) => product.category))]) {
    const created = await prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase(),
      },
    });
    categories.set(name, created.id);
  }

  const products = new Map<string, string>();
  for (const product of demoProducts) {
    const created = await prisma.product.create({
      data: {
        vendorId: users.get(product.vendorId)!,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        images: product.images,
        categoryId: categories.get(product.category),
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        stockQuantity: product.stockQuantity,
        sku: product.sku,
        status: product.status === "ACTIVE" ? "ACTIVE" : "OUT_OF_STOCK",
        tags: product.tags,
      },
    });
    products.set(product.id, created.id);
  }

  const posts = new Map<string, string>();
  for (const post of demoPosts) {
    const created = await prisma.post.create({
      data: {
        creatorId: users.get(post.creator.id)!,
        slug: post.slug,
        caption: post.caption,
        hashtags: post.hashtags,
        media: post.media.map((media, order) => ({ ...media, order })),
        productId: post.product ? products.get(post.product.id) : undefined,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
      },
    });
    posts.set(post.id, created.id);
  }

  for (const comment of demoComments) {
    await prisma.comment.create({
      data: {
        postId: posts.get(comment.postId) ?? [...posts.values()][0],
        userId: users.get(comment.user.id) ?? users.get("user-demo")!,
        text: comment.text,
        likeCount: comment.likeCount,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
