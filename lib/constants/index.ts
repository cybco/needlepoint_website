export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Stitch A Lot Studio";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Quality needlepoint products for your lifestyle";
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 12;

export const SignInDefaultValues = {
  email: "",
  password: "",
};

export const SignUpDefaultValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export const shippingAddressDefaultValues = {
  firstName: "",
  lastName: "",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "USA",
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(", ")
  : ["Credit Card", "PayPal"];
export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD || "Credit Card";

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

export const productDefaultValues = {
  name: "",
  slug: "",
  categoryIds: [],
  primaryCategoryId: "",
  images: [],
  brand: "",
  description: "",
  price: "0",
  rating: "0",
  stock: 0,
  numReviews: "0",
  isFeatured: false,
  banner: null,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: [],
  isPublished: true,
  isPrivate: false,
};
export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(", ")
  : ["user", "admin"];

export const reviewFormDefualtValues = {
  title: "",
  comment: "",
  rating: 0,
};

export const SENDER_EMAIL = process.env.SENDER_EMAIL;
export const BREVO_API_KEY = process.env.BREVO_API_KEY;
