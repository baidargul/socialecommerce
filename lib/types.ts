export type UserRole = "CUSTOMER" | "CREATOR" | "VENDOR" | "ADMIN";

export type DemoUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl: string;
  bio?: string;
  role: UserRole;
};

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  images: string[];
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stockQuantity: number;
  sku: string;
  status: "ACTIVE" | "OUT_OF_STOCK";
  tags: string[];
  vendorName: string;
};

export type FeedPost = {
  id: string;
  slug: string;
  creator: DemoUser;
  caption: string;
  hashtags: string[];
  media: { url: string; type: "image"; width: number; height: number }[];
  product?: Product;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
};

export type Story = {
  id: string;
  creator: DemoUser;
  mediaUrl: string;
  viewed: boolean;
  product?: Product;
};

export type CommentItem = {
  id: string;
  postId: string;
  user: DemoUser;
  text: string;
  likeCount: number;
  createdAt: string;
};

export type CartLine = {
  product: Product;
  quantity: number;
};
