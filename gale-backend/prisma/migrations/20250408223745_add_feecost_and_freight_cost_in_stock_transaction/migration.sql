/*
  Warnings:

  - Added the required column `totalCostProduct` to the `StockEntryDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feeCost` to the `StockTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `freightCost` to the `StockTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalProductCost` to the `StockTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockEntryDetails" ADD COLUMN     "totalCostProduct" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "StockTransaction" ADD COLUMN     "feeCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "freightCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalProductCost" DECIMAL(10,2) NOT NULL;
