/*
  Warnings:

  - Added the required column `costProduct` to the `StockEntryDetails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockEntryDetails" ADD COLUMN     "costProduct" DECIMAL(10,2) NOT NULL;
