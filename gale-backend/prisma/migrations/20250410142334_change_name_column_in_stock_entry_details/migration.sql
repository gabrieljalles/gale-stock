/*
  Warnings:

  - You are about to drop the column `costProduct` on the `StockEntryDetails` table. All the data in the column will be lost.
  - You are about to drop the column `totalCostProduct` on the `StockEntryDetails` table. All the data in the column will be lost.
  - Added the required column `productCost` to the `StockEntryDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalProductCost` to the `StockEntryDetails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockEntryDetails" DROP COLUMN "costProduct",
DROP COLUMN "totalCostProduct",
ADD COLUMN     "productCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalProductCost" DECIMAL(10,2) NOT NULL;
