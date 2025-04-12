/*
  Warnings:

  - You are about to alter the column `finalConsumerPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `finalIfoodConsumerPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `discountPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `discountQtdPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `totalCost` on the `StockTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `amount` on the `StockTransactionInstallment` table. All the data in the column will be lost.
  - Added the required column `costFragment` to the `StockTransactionInstallment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Catalog" ALTER COLUMN "finalConsumerPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "finalIfoodConsumerPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discountPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discountQtdPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StockTransaction" ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "StockTransactionInstallment" DROP COLUMN "amount",
ADD COLUMN     "costFragment" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "city" TEXT NOT NULL;
