-- This migration adds the backgroundSize field to the Theme table
-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "backgroundSize" TEXT NOT NULL DEFAULT 'cover';