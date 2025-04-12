/*
  Warnings:

  - You are about to drop the column `costFragment` on the `StockTransactionInstallment` table. All the data in the column will be lost.
  - Added the required column `fragmentCost` to the `StockTransactionInstallment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockTransactionInstallment" DROP COLUMN "costFragment",
ADD COLUMN     "fragmentCost" DECIMAL(10,2) NOT NULL;
