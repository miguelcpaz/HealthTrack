-- AlterTable
ALTER TABLE "public"."Hospital" ADD COLUMN     "status_senha" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "status_senha" INTEGER NOT NULL DEFAULT 0;
