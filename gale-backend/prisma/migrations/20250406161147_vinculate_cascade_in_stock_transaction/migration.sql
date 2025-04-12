-- DropForeignKey
ALTER TABLE "StockEntryDetails" DROP CONSTRAINT "StockEntryDetails_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "StockTransactionInstallment" DROP CONSTRAINT "StockTransactionInstallment_stockTransactionId_fkey";

-- AddForeignKey
ALTER TABLE "StockTransactionInstallment" ADD CONSTRAINT "StockTransactionInstallment_stockTransactionId_fkey" FOREIGN KEY ("stockTransactionId") REFERENCES "StockTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryDetails" ADD CONSTRAINT "StockEntryDetails_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "StockTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
