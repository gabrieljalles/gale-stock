/*
  Warnings:

  - You are about to drop the column `stock` on the `Catalog` table. All the data in the column will be lost.
  - You are about to drop the `OrderDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockEntryDetails` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[barCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "OrderDetails" DROP CONSTRAINT "OrderDetails_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderDetails" DROP CONSTRAINT "OrderDetails_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockEntryDetails" DROP CONSTRAINT "StockEntryDetails_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockEntryDetails" DROP CONSTRAINT "StockEntryDetails_stockTransactionId_fkey";

-- AlterTable
ALTER TABLE "Catalog" DROP COLUMN "stock";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barCode" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "email" TEXT,
ADD COLUMN     "imgUrl" TEXT;

-- DropTable
DROP TABLE "OrderDetails";

-- DropTable
DROP TABLE "StockEntryDetails";

-- CreateTable
CREATE TABLE "StockEntryDetail" (
    "id" TEXT NOT NULL,
    "stockTransactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "baseUnitCost" DECIMAL(10,2) NOT NULL,
    "landedUnitCost" DECIMAL(10,2) NOT NULL,
    "initialQuantity" INTEGER NOT NULL,
    "quantityOnStock" INTEGER NOT NULL,
    "totalProductCost" DECIMAL(10,2) NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockEntryDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "stockEntryDetailId" TEXT NOT NULL,
    "orderDetailId" TEXT NOT NULL,
    "quantityMoved" INTEGER NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDetail" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unityPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_barCode_key" ON "Product"("barCode");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- AddForeignKey
ALTER TABLE "StockEntryDetail" ADD CONSTRAINT "StockEntryDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryDetail" ADD CONSTRAINT "StockEntryDetail_stockTransactionId_fkey" FOREIGN KEY ("stockTransactionId") REFERENCES "StockTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockEntryDetailId_fkey" FOREIGN KEY ("stockEntryDetailId") REFERENCES "StockEntryDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderDetailId_fkey" FOREIGN KEY ("orderDetailId") REFERENCES "OrderDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDetail" ADD CONSTRAINT "OrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDetail" ADD CONSTRAINT "OrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
