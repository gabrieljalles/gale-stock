/*
  Warnings:

  - You are about to drop the column `addressId` on the `OrderRequest` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `UserAddress` table. All the data in the column will be lost.
  - You are about to drop the column `lon` on the `UserAddress` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderRequest" DROP CONSTRAINT "OrderRequest_addressId_fkey";

-- AlterTable
ALTER TABLE "OrderRequest" DROP COLUMN "addressId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "UserAddress" DROP COLUMN "lat",
DROP COLUMN "lon",
ALTER COLUMN "complement" DROP NOT NULL,
ALTER COLUMN "zipCode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OrderAddress" (
    "id" TEXT NOT NULL,
    "orderRequestId" TEXT NOT NULL,
    "typeAddress" "TypeAddress" NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "complement" TEXT,
    "zipCode" TEXT,

    CONSTRAINT "OrderAddress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderAddress" ADD CONSTRAINT "OrderAddress_orderRequestId_fkey" FOREIGN KEY ("orderRequestId") REFERENCES "OrderRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
