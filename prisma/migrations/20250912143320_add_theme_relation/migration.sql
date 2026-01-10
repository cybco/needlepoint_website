-- CreateEnum
CREATE TYPE "public"."LayoutType" AS ENUM ('STACK', 'GRID', 'MASONRY', 'MINIMAL', 'SPOTLIGHT');

-- CreateEnum
CREATE TYPE "public"."BackgroundType" AS ENUM ('SOLID', 'GRADIENT', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."ButtonStyle" AS ENUM ('SQUARE', 'ROUNDED', 'PILL', 'GHOST', 'GLASS');

-- CreateEnum
CREATE TYPE "public"."LinkStyle" AS ENUM ('CARD', 'BUTTON', 'LIST', 'COMPACT', 'FEATURED');

-- CreateEnum
CREATE TYPE "public"."FontSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');

-- CreateEnum
CREATE TYPE "public"."FontWeight" AS ENUM ('LIGHT', 'NORMAL', 'MEDIUM', 'SEMIBOLD', 'BOLD');

-- CreateEnum
CREATE TYPE "public"."SpacingType" AS ENUM ('COMPACT', 'NORMAL', 'RELAXED', 'SPACIOUS');

-- CreateEnum
CREATE TYPE "public"."AnimationType" AS ENUM ('NONE', 'HOVER_LIFT', 'HOVER_SCALE', 'HOVER_GLOW', 'HOVER_SLIDE');

-- CreateEnum
CREATE TYPE "public"."HoverEffect" AS ENUM ('NONE', 'SCALE', 'LIFT', 'GLOW', 'ROTATE', 'SLIDE');

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "resetTokenExpires" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."Theme" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "linkListId" UUID,
    "name" TEXT NOT NULL DEFAULT 'Custom Theme',
    "layout" "public"."LayoutType" NOT NULL DEFAULT 'STACK',
    "containerWidth" TEXT NOT NULL DEFAULT 'max-w-2xl',
    "spacing" "public"."SpacingType" NOT NULL DEFAULT 'NORMAL',
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "accentColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "backgroundType" "public"."BackgroundType" NOT NULL DEFAULT 'SOLID',
    "gradientStart" TEXT,
    "gradientEnd" TEXT,
    "gradientAngle" INTEGER NOT NULL DEFAULT 180,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "headingFont" TEXT NOT NULL DEFAULT 'Inter',
    "fontSize" "public"."FontSize" NOT NULL DEFAULT 'MEDIUM',
    "fontWeight" "public"."FontWeight" NOT NULL DEFAULT 'NORMAL',
    "buttonStyle" "public"."ButtonStyle" NOT NULL DEFAULT 'ROUNDED',
    "buttonAnimation" "public"."AnimationType" NOT NULL DEFAULT 'HOVER_LIFT',
    "linkStyle" "public"."LinkStyle" NOT NULL DEFAULT 'CARD',
    "linkHoverEffect" "public"."HoverEffect" NOT NULL DEFAULT 'SCALE',
    "backgroundImage" TEXT,
    "backgroundVideo" TEXT,
    "backgroundBlur" INTEGER NOT NULL DEFAULT 0,
    "backgroundOpacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "customCSS" TEXT,
    "animations" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_linkListId_key" ON "public"."Theme"("linkListId");

-- CreateIndex
CREATE INDEX "theme_userId_idx" ON "public"."Theme"("userId");

-- AddForeignKey
ALTER TABLE "public"."Theme" ADD CONSTRAINT "Theme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Theme" ADD CONSTRAINT "Theme_linkListId_fkey" FOREIGN KEY ("linkListId") REFERENCES "public"."LinkList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
