/*
  Warnings:

  - Added the required column `nivelalerta` to the `Paciente` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Paciente" ADD COLUMN     "nivelalerta" TEXT NOT NULL;
