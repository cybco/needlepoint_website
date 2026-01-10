import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";
import { PAYMENT_METHODS } from "./constants";

const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    "Price must have exactly two decimal places"
  );

// Schema for inserting products
export const insertProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  brand: z.string().min(3, "Brand must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  stock: z.coerce.number(),
  images: z.array(z.string()).min(1, "Product must have at least one image"),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
  categoryIds: z.array(z.string().uuid("Category ID must be a valid UUID")).min(1, "Product must be assigned to at least one category"),
  primaryCategoryId: z.string().uuid("Primary category ID must be a valid UUID"),
  seoTitle: z.string().max(60, "SEO title must not exceed 60 characters").optional().nullable(),
  seoDescription: z.string().max(160, "SEO description must not exceed 160 characters").optional().nullable(),
  seoKeywords: z.array(z.string().max(50, "SEO keyword must not exceed 50 characters")).default([]),
  isPublished: z.boolean().default(true),
  isPrivate: z.boolean().default(false),
});

// Schema for updating products
export const updateProductSchema = insertProductSchema.extend({
  id: z.string().min(1, "Id is required"),
});

// schema for signing users in
export const signInFormSchema = z.object({
  email: z.string().email("invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// schema for signing up user

export const signUpFormSchema = z
  .object({
    email: z.string().email("invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Cart Schemas
export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  qty: z.number().int().nonnegative("Quantitity must be a positive number"),
  image: z.string().min(1, "Image is required"),
  price: currency,
});

export const insertCartSchema = z.object({
  items: z.array(cartItemSchema),
  itemsPrice: currency,
  totalPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  sessionCartId: z.string().min(1, "Session cart id is required"),
  userId: z.string().optional().nullable(),
});

// schema for shipping address
export const shippingAddressSchema = z.object({
  firstName: z.string().min(2, "First Name must be at least 2 characters"),
  lastName: z.string().min(2, "Last Name must be at least 2 characters"),
  streetAddress: z.string().min(3, "Address must be at least 3 characters"),
  city: z.string().min(3, "City must be at least 3 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  state: z.string().min(3, "State must be at least 3 characters"),
  country: z.string().min(3, "Country must be at least 3 characters"),
});

// schemna for payment method
export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, "Payment method is required"),
  }) // must be one of the payment types
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    path: ["type"],
    message: "Invalid payment method",
  });

// Schema for inserting order
export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User is required"),
  itemsPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  totalPrice: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: "Invalid payment method",
  }),
  shippingAddress: shippingAddressSchema,
});

// Schema for inserting order item
export const insertOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  price: currency,
  qty: z.number(),
});

export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  pricePaid: z.string(),
});

// schema for updating user profile
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().min(3, "Email must be at least 3 characters"),
  phone: z.string().optional(),
  streetAddressHouseNumStreet: z.string().optional(),
  streetAddressLine2: z.string().optional(),
  city: z.string().optional(),
  State: z.string().optional(),
  zip: z.string().optional(),
});

// schema for changing email (logged in users)
export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newEmail: z.string().email("Invalid email address"),
  confirmEmail: z.string().email("Invalid email address"),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
});

// schema for changing password (logged in users)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(7, "Password must be at least 7 characters").refine((password) => /\d/.test(password), {
    message: "Password must include at least one number",
  }),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for updating user
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, "Id is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
  streetAddressHouseNumStreet: z.string().optional(),
  streetAddressLine2: z.string().optional(),
  city: z.string().optional(),
  State: z.string().optional(),
  zip: z.string().optional(),
});

// Schema to insert reviews
export const insertReviewSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  productId: z.string().min(1, "Product is required"),
  userId: z.string().min(1, "User is required"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});

// Category Schemas
export const insertCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  displayName: z.string().min(1, "Display name is required").max(100, "Display name must not exceed 100 characters"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must not exceed 100 characters"),
  description: z.string().max(500, "Description must not exceed 500 characters").optional().nullable(),
  image: z.string().max(255, "Image URL must not exceed 255 characters").optional().nullable(),
  parentId: z.union([z.string().uuid("Parent ID must be a valid UUID"), z.null()]).optional(),
  sortOrder: z.number().int().min(0, "Sort order must be non-negative").default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().max(60, "SEO title must not exceed 60 characters").optional().nullable(),
  seoDescription: z.string().max(160, "SEO description must not exceed 160 characters").optional().nullable(),
  seoKeywords: z.array(z.string().max(50, "SEO keyword must not exceed 50 characters")).default([]),
});

export const updateCategorySchema = insertCategorySchema.extend({
  id: z.string().uuid("Category ID must be a valid UUID"),
});

export const categorySortSchema = z.object({
  categoryId: z.string().uuid("Category ID must be a valid UUID"),
  sortOrder: z.number().int().min(0, "Sort order must be non-negative"),
});

export const categoryBulkOperationSchema = z.object({
  operation: z.enum(["activate", "deactivate", "delete"]),
  categoryIds: z.array(z.string().uuid("Category ID must be a valid UUID")).min(1, "At least one category must be selected"),
});

export const categoryMergeSchema = z.object({
  sourceCategoryId: z.string().uuid("Source category ID must be a valid UUID"),
  targetCategoryId: z.string().uuid("Target category ID must be a valid UUID"),
}).refine((data) => data.sourceCategoryId !== data.targetCategoryId, {
  message: "Source and target categories must be different",
  path: ["targetCategoryId"],
});

export const categorySearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Query must not exceed 100 characters"),
  limit: z.number().int().min(1).max(50).default(10),
});

export const categoryProductsSchema = z.object({
  categoryId: z.string().uuid("Category ID must be a valid UUID"),
  page: z.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort: z.enum(["name", "price", "rating", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
