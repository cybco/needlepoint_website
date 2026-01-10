import { hashSync } from "bcrypt-ts-edge";

const sampleData = {
  users: [
    {
      firstName: "admin",
      email: "mike@muddyfrog.com",
      password: hashSync("123456", 10),
      role: "admin",
      updatedAt: new Date(),
    },
    {
      firstName: "user",
      email: "mike@cybco.com",
      password: hashSync("123456", 10),
      role: "user",
      updatedAt: new Date(),
    },
  ],
  products: [
    {
      name: "Sample Product",
      slug: "sample-product",
      category: "Clothing",
      description: "A great sample product",
      images: ["/images/p1-1.jpg", "/images/p1-2.jpg"],
      price: 59.99,
      brand: "Polo",
      rating: 4.5,
      numReviews: 10,
      stock: 5,
      isFeatured: true,
      banner: "banner-1.jpg",
    },
  ],
};

export default sampleData;
