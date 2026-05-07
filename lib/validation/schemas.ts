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

export const commentSchema = z.object({
  text: z.string().min(1).max(500),
});

export const cartQuantitySchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const orderSchema = z.object({
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
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
