-- Fix column type for resetTokenExpires to match schema expectations
-- This addresses the type drift detected between database and migration history
ALTER TABLE "User" ALTER COLUMN "resetTokenExpires" TYPE TIMESTAMP(6);