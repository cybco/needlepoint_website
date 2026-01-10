-- Add missing columns that exist in database but not in migration history

-- Add missing columns to LinkItem
ALTER TABLE "LinkItem" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LinkItem" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(6);

-- Add missing columns to User  
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP(6);