/*
  Warnings:

  - You are about to drop the column `endereco` on the `Hospital` table. All the data in the column will be lost.
  - Added the required column `cep` to the `Hospital` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `Hospital` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Hospital" DROP COLUMN "endereco",
ADD COLUMN     "cep" TEXT NOT NULL,
ADD COLUMN     "numero" TEXT NOT NULL;
