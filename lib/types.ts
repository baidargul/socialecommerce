export type UserRole = "CUSTOMER" | "CREATOR" | "VENDOR" | "ADMIN";

export type DemoUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
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
  media?: {
    url: string;
    type: "image" | "video";
    fileName?: string;
    order: number;
    isPrimary: boolean;
  }[];
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stockQuantity: number;
  sku: string;
  status: "ACTIVE" | "OUT_OF_STOCK";
  tags: string[];
  vendorName: string;
  createdAt?: string;
};

export type FeedPost = {
  id: string;
  slug: string;
  creator: DemoUser;
  caption: string;
  hashtags: string[];
  media: {
    url: string;
    type: "image" | "video";
    width: number;
    height: number;
  }[];
  product?: Product;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
  createdAt?: string;
};

export type Story = {
  id: string;
  creator: DemoUser;
  mediaUrl?: string;
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

export type Address = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
};

export type AddressInput = Address & {
  label?: string;
  isDefault?: boolean;
};

export type UserAddress = Address & {
  id: string;
  userId: string;
  label?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  productId: string;
  vendorId: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  total: number;
};

export type OrderSummary = {
  id: string;
  userId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  customerName: string;
  customerEmail?: string;
  createdAt: string;
};

export type OrderDetail = OrderSummary & {
  shippingAddress: Address;
  items: OrderItem[];
};

export type CheckoutInput = {
  paymentMethod: "COD";
  addressId?: string;
  shippingAddress?: Address;
  saveAddress?: boolean;
};

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  productCount: number;
  createdAt: string;
};
