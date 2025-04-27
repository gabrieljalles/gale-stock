-- CreateEnum
CREATE TYPE "TypeAddress" AS ENUM ('Street', 'Avanue', 'Alley', 'Lane', 'Highway', 'Road', 'Square', 'Village', 'Condominium');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('InStore', 'Delivery');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PickedUp', 'Draft', 'Placed', 'ReadyToPickup', 'OutForDelivery', 'Delivered', 'DeliveryFailed', 'Cancelled', 'Confirmed', 'Preparing', 'OnAccount', 'Concluded');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('App', 'WhatsApp', 'Instagram', 'Call', 'Local', 'Ifood');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Admin', 'Shopper', 'DeliveryMan', 'Client');

-- CreateEnum
CREATE TYPE "SizeType" AS ENUM ('g', 'L', 'ml', 'mg', 'kg', 'un');

-- CreateEnum
CREATE TYPE "ReasonLoss" AS ENUM ('Theft', 'DamegedProduct', 'CustomerReturn', 'Expiration', 'Operacional', 'Loss');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Beers', 'Tobacco', 'NonAlcoholic', 'Spirits', 'Candy', 'FrozenFoods', 'PharmacyPersonalCare', 'Grocery', 'Wines', 'Snacks', 'Others');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BankSlip', 'CreditCard', 'Money', 'Pix', 'DebitCard', 'OnTheBill');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "Category" NOT NULL,
    "tags" TEXT[],
    "sizeType" "SizeType" NOT NULL,
    "pack" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "legalRepresentative" TEXT NOT NULL,
    "enterprise" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "appName" TEXT,
    "city" TEXT NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "numberPayments" INTEGER NOT NULL,
    "firstPaymentDate" TIMESTAMP(3),
    "totalProductCost" DECIMAL(10,2) NOT NULL,
    "freightCost" DECIMAL(10,2) NOT NULL,
    "feeCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "statusCheckout" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransactionInstallment" (
    "id" TEXT NOT NULL,
    "stockTransactionId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "fragmentCost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "StockTransactionInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEntryDetails" (
    "id" TEXT NOT NULL,
    "stockTransactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCost" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalProductCost" DECIMAL(10,2) NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockEntryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostEntry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reasonLoss" "ReasonLoss" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "finalConsumerPrice" DECIMAL(10,2),
    "finalIfoodConsumerPrice" DECIMAL(10,2),
    "isLiquidation" BOOLEAN NOT NULL DEFAULT false,
    "discountPrice" DECIMAL(10,2),
    "quantityDiscount" INTEGER,
    "discountQtdPrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCatalog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "initialDate" TIMESTAMP(3) NOT NULL,
    "finalDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'InStore',
    "orderSource" "OrderSource",
    "clientId" TEXT,
    "deliveryManId" TEXT,
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'Confirmed',
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDetails" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unityPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transactionType" "TransactionType",
    "totalProductPrice" DECIMAL(10,2) NOT NULL,
    "freightPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "statusCheckout" TEXT NOT NULL,
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAddress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "typeAddress" "TypeAddress" NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "complement" TEXT,
    "zipCode" TEXT,

    CONSTRAINT "OrderAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cellPhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfCNPJ" TEXT NOT NULL,
    "accountType" "AccountType" DEFAULT 'Client',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "typeAddress" "TypeAddress" NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "district" TEXT NOT NULL,
    "zipCode" TEXT,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransactionInstallment" ADD CONSTRAINT "StockTransactionInstallment_stockTransactionId_fkey" FOREIGN KEY ("stockTransactionId") REFERENCES "StockTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryDetails" ADD CONSTRAINT "StockEntryDetails_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryDetails" ADD CONSTRAINT "StockEntryDetails_stockTransactionId_fkey" FOREIGN KEY ("stockTransactionId") REFERENCES "StockTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostEntry" ADD CONSTRAINT "LostEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_id_fkey" FOREIGN KEY ("id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCatalog" ADD CONSTRAINT "DiscountCatalog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryManId_fkey" FOREIGN KEY ("deliveryManId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTransaction" ADD CONSTRAINT "OrderTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddress" ADD CONSTRAINT "OrderAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
