/*
  Warnings:

  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_orderDetailId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_stockEntryDetailId_fkey";

-- AlterTable
ALTER TABLE "StockTransaction" ADD COLUMN     "nfeAccessKey" TEXT;

-- DropTable
DROP TABLE "StockMovement";
