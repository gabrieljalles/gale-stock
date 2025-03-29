-- CreateEnum
CREATE TYPE "SizeType" AS ENUM ('g', 'l', 'ml', 'mg', 'kg', 'un');

-- CreateEnum
CREATE TYPE "ReasonLoss" AS ENUM ('Furto', 'ProdutoDanificado', 'DevolucaoCliente', 'Validade', 'Operacional', 'Perda');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Cervejas', 'Tabacaria', 'NaoAlcoolicos', 'Destilados', 'Fermentados', 'Guloseimas', 'FriosCongelados', 'FarmaciaHigienePessoal', 'Mercearia', 'Vinhos', 'Salgadinhos', 'Outros');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BankSlip', 'CreditCard', 'Money', 'Pix', 'DebitCard');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
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

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "NumberPayments" INTEGER NOT NULL,
    "firstPaymentDate" TIMESTAMP(3),
    "totalCost" DOUBLE PRECISION NOT NULL,
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
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StockTransactionInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEntryDetails" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT NOT NULL,

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
    "finalConsumerPrice" DOUBLE PRECISION NOT NULL,
    "finalIfoodConsumerPrice" DOUBLE PRECISION NOT NULL,
    "discountPrice" DOUBLE PRECISION NOT NULL,
    "quantityDiscount" INTEGER NOT NULL,
    "discountQtdPrice" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransactionInstallment" ADD CONSTRAINT "StockTransactionInstallment_stockTransactionId_fkey" FOREIGN KEY ("stockTransactionId") REFERENCES "StockTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryDetails" ADD CONSTRAINT "StockEntryDetails_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryDetails" ADD CONSTRAINT "StockEntryDetails_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "StockTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostEntry" ADD CONSTRAINT "LostEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_id_fkey" FOREIGN KEY ("id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
