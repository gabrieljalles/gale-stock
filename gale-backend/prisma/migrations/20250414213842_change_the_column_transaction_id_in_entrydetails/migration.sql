/*
  Warnings:

  - You are about to drop the column `transactionId` on the `StockEntryDetails` table. All the data in the column will be lost.
  - Added the required column `stockTransactionId` to the `StockEntryDetails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'OnTheBill';

-- DropForeignKey
ALTER TABLE "Catalog" DROP CONSTRAINT "Catalog_id_fkey";

-- DropForeignKey
ALTER TABLE "StockEntryDetails" DROP CONSTRAINT "StockEntryDetails_transactionId_fkey";

-- AlterTable
ALTER TABLE "StockEntryDetails" DROP COLUMN "transactionId",
ADD COLUMN     "stockTransactionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "StockEntryDetails" ADD CONSTRAINT "StockEntryDetails_stockTransactionId_fkey" FOREIGN KEY ("stockTransactionId") REFERENCES "StockTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_id_fkey" FOREIGN KEY ("id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
