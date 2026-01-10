import { z } from "zod";
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  paymentResultSchema,
  insertReviewSchema,
  insertCategorySchema,
} from "@/lib/validators";

// Base product type for database entities (without category relations)
export type ProductBase = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  brand: string;
  description: string;
  stock: number;
  price: string;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  banner: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  createdAt: Date;
  isPublished: boolean;
  isPrivate: boolean;
  privateSlug: string | null;
};

// Product type for forms and API inputs
export type ProductInput = z.infer<typeof insertProductSchema>;

// Product type with category relations for display
export type Product = ProductBase & {
  categories?: {
    categoryId: string;
    isPrimary: boolean;
    category: {
      id: string;
      name: string;
      displayName: string;
      slug: string;
    };
  }[];
};

export type Category = z.infer<typeof insertCategorySchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type OrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  createdAt: Date;
  isPaid: Boolean;
  paidAt: Date | null;
  isDelivered: Boolean;
  deliveredAt: Date | null;
  orderItems: OrderItem[];
  user: { firstName: string; email: string };
  paymentResult: PaymentResult;
};
export type PaymentResult = z.infer<typeof paymentResultSchema>;
export type Review = z.infer<typeof insertReviewSchema> & {
  id: string;
  createdAt: Date;
  user?: { firstName: string };
};
