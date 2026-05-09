import type { Prisma } from "@prisma/client";
import { canUseDatabase, prisma } from "@/lib/prisma";
import type { DemoUser, FeedPost, Product, Story } from "@/lib/types";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    vendor: true;
  };
}>;

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    creator: true;
    product: {
      include: {
        category: true;
        vendor: true;
      };
    };
  };
}>;

function mapUser(user: PostWithRelations["creator"] | ProductWithRelations["vendor"]): DemoUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email ?? undefined,
    avatarUrl: user.avatarUrl ?? "",
    bio: user.bio ?? undefined,
    role: user.role,
  };
}

function mapProduct(product: ProductWithRelations): Product {
  return {
    id: product.id,
    vendorId: product.vendorId,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    images: product.images,
    category: product.category?.name ?? "Uncategorized",
    price: product.price,
    originalPrice: product.originalPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
    stockQuantity: product.stockQuantity,
    sku: product.sku ?? "",
    status: product.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "ACTIVE",
    tags: product.tags,
    vendorName: product.vendor.username,
  };
}

function mapPost(post: PostWithRelations): FeedPost {
  return {
    id: post.id,
    slug: post.slug,
    creator: mapUser(post.creator),
    caption: post.caption,
    hashtags: post.hashtags,
    media: post.media.map((media) => ({
      url: media.url,
      type: "image",
      width: media.width ?? 0,
      height: media.height ?? 0,
    })),
    product: post.product ? mapProduct(post.product) : undefined,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
  };
}

export async function getDatabaseFeed(limit = 10): Promise<{ posts: FeedPost[]; stories: Story[] } | null> {
  if (!canUseDatabase()) return null;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      creator: true,
      product: {
        include: {
          category: true,
          vendor: true,
        },
      },
    },
  });

  const mappedPosts = posts.map(mapPost);
  const stories = mappedPosts
    .filter((post) => post.media[0])
    .map((post) => ({
      id: `story-${post.id}`,
      creator: post.creator,
      mediaUrl: post.media[0]?.url ?? "",
      viewed: false,
      product: post.product,
    }));

  return { posts: mappedPosts, stories };
}

export async function getDatabaseProducts(query = ""): Promise<Product[] | null> {
  if (!canUseDatabase()) return null;

  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      vendor: true,
    },
  });

  return products.map(mapProduct);
}
