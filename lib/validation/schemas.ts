import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const accountSettingsSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  phone: z.string().min(7).max(30).optional().or(z.literal("")),
  bio: z.string().max(240).optional().or(z.literal("")),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "New passwords must match.",
    path: ["confirmPassword"],
  });

export const commentSchema = z.object({
  text: z.string().min(1).max(500),
});

export const cartQuantitySchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const orderSchema = z.object({
  paymentMethod: z.literal("COD"),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    addressLine: z.string().min(5),
    city: z.string().min(2),
    state: z.string().optional(),
    country: z.string().min(2),
    postalCode: z.string().optional(),
  }),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .or(z.literal("")),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(240).optional(),
  images: z.array(z.string()).max(12).default([]),
  primaryMediaIndex: z.coerce.number().int().min(0).max(11).default(0),
  category: z.string().min(2).max(80).optional().or(z.literal("")),
  price: z.coerce.number().positive(),
  originalPrice: z.coerce.number().positive().optional().or(z.literal("")),
  discountPercent: z.coerce.number().int().min(0).max(95).optional().or(z.literal("")),
  stockQuantity: z.coerce.number().int().min(0).max(999999).default(0),
  sku: z.string().max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const productBatchSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(100),
  operation: z.enum(["delete", "quantity", "status", "category"]),
  quantityMode: z.enum(["set", "increase", "decrease"]).optional(),
  quantity: z.coerce.number().int().min(0).max(999999).optional(),
  status: z.enum(["ACTIVE", "OUT_OF_STOCK"]).optional(),
  category: z.string().min(2).max(80).optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .or(z.literal("")),
  parentId: z.string().min(1).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
