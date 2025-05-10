/*
  Warnings:

  - You are about to alter the column `consumerIfoodPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `consumerNightPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `consumerPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `discountPackPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `liquidationPrice` on the `Catalog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `unityPrice` on the `OrderDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `totalPrice` on the `OrderDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `totalProductPrice` on the `OrderTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `freightPrice` on the `OrderTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `totalPrice` on the `OrderTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `baseUnitCost` on the `StockEntryDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `landedUnitCost` on the `StockEntryDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `totalProductCost` on the `StockEntryDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `totalProductCost` on the `StockTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `freightCost` on the `StockTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `feeCost` on the `StockTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `totalCost` on the `StockTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.
  - You are about to alter the column `fragmentCost` on the `StockTransactionInstallment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "Catalog" ALTER COLUMN "consumerIfoodPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "consumerNightPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "consumerPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "discountPackPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "liquidationPrice" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "OrderDetail" ALTER COLUMN "unityPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "OrderTransaction" ALTER COLUMN "totalProductPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "freightPrice" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "StockEntryDetail" ALTER COLUMN "baseUnitCost" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "landedUnitCost" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "totalProductCost" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "StockTransaction" ALTER COLUMN "totalProductCost" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "freightCost" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "feeCost" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "StockTransactionInstallment" ALTER COLUMN "fragmentCost" SET DATA TYPE DECIMAL(10,4);
