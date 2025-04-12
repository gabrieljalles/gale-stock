/*
  Warnings:

  - You are about to drop the column `NumberPayments` on the `StockTransaction` table. All the data in the column will be lost.
  - Added the required column `numberPayments` to the `StockTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockTransaction" DROP COLUMN "NumberPayments",
ADD COLUMN     "numberPayments" INTEGER NOT NULL;
