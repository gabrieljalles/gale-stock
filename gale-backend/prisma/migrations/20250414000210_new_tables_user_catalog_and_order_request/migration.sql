/*
  Warnings:

  - The values [Furto,ProdutoDanificado,DevolucaoCliente,Validade,Perda] on the enum `ReasonLoss` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TypeAddress" AS ENUM ('Street', 'Avanue', 'Alley', 'Lane', 'Highway', 'Road', 'Square', 'Village', 'Condominium');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('Freight', 'InPerson');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Draft', 'Placed', 'Confirmed', 'Preparing', 'ReadyToPickup', 'Dispatched', 'Concluded', 'Cancelled');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('App', 'WhatsApp', 'Instagram', 'Cellphone', 'InPerson', 'Ifood');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Admin', 'Shopper', 'DeliveryMan', 'Client');

-- AlterEnum
BEGIN;
CREATE TYPE "ReasonLoss_new" AS ENUM ('Theft', 'DamegedProduct', 'CustomerReturn', 'Expiration', 'Operacional', 'Loss');
ALTER TABLE "LostEntry" ALTER COLUMN "reasonLoss" TYPE "ReasonLoss_new" USING ("reasonLoss"::text::"ReasonLoss_new");
ALTER TYPE "ReasonLoss" RENAME TO "ReasonLoss_old";
ALTER TYPE "ReasonLoss_new" RENAME TO "ReasonLoss";
DROP TYPE "ReasonLoss_old";
COMMIT;

-- AlterTable
ALTER TABLE "Catalog" ADD COLUMN     "isLiquidation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DiscountCatalog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "initialDate" TIMESTAMP(3) NOT NULL,
    "finalDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderRequest" (
    "id" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "orderSource" "OrderSource" NOT NULL,
    "clientId" TEXT,
    "deliveryManId" TEXT,
    "addressId" TEXT,
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'Confirmed',
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDetails" (
    "id" TEXT NOT NULL,
    "orderRequestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unityPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTransaction" (
    "id" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "statusCheckout" TEXT NOT NULL,
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cellPhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfCNPJ" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "typeAddress" "TypeAddress" NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "lat" TEXT,
    "lon" TEXT,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "DiscountCatalog" ADD CONSTRAINT "DiscountCatalog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_deliveryManId_fkey" FOREIGN KEY ("deliveryManId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "UserAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_orderRequestId_fkey" FOREIGN KEY ("orderRequestId") REFERENCES "OrderRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
