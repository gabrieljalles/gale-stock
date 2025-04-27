/*
  Warnings:

  - You are about to drop the column `discountPrice` on the `Catalog` table. All the data in the column will be lost.
  - You are about to drop the column `discountQtdPrice` on the `Catalog` table. All the data in the column will be lost.
  - You are about to drop the column `finalConsumerPrice` on the `Catalog` table. All the data in the column will be lost.
  - You are about to drop the column `finalIfoodConsumerPrice` on the `Catalog` table. All the data in the column will be lost.
  - You are about to drop the column `quantityDiscount` on the `Catalog` table. All the data in the column will be lost.
  - You are about to drop the column `statusCheckout` on the `OrderTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Catalog" DROP COLUMN "discountPrice",
DROP COLUMN "discountQtdPrice",
DROP COLUMN "finalConsumerPrice",
DROP COLUMN "finalIfoodConsumerPrice",
DROP COLUMN "quantityDiscount",
ADD COLUMN     "consumerIfoodPrice" DECIMAL(10,2),
ADD COLUMN     "consumerNightPrice" DECIMAL(10,2),
ADD COLUMN     "consumerPrice" DECIMAL(10,2),
ADD COLUMN     "discountPackPrice" DECIMAL(10,2),
ADD COLUMN     "liquidationPrice" DECIMAL(10,2),
ADD COLUMN     "packageDiscountAmount" INTEGER;

-- AlterTable
ALTER TABLE "OrderTransaction" DROP COLUMN "statusCheckout",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;
