-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "parentId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- Create temp column to backup existing categories
ALTER TABLE "Product" ADD COLUMN "temp_category" TEXT;
UPDATE "Product" SET "temp_category" = "category";

-- Insert existing categories into Category table
INSERT INTO "Category" ("name", "displayName", "slug", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT 
    category,
    category,
    LOWER(REPLACE(category, ' ', '-')),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product" 
WHERE category IS NOT NULL AND category != '';

-- Link existing products to their categories via ProductCategory
INSERT INTO "ProductCategory" ("productId", "categoryId", "isPrimary")
SELECT 
    p.id,
    c.id,
    true
FROM "Product" p
JOIN "Category" c ON c.name = p.temp_category
WHERE p.temp_category IS NOT NULL AND p.temp_category != '';

-- Drop temp column and original category column
ALTER TABLE "Product" DROP COLUMN "temp_category";
ALTER TABLE "Product" DROP COLUMN "category";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;