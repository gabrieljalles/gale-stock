/*
  Warnings:

  - The values [Cellphone,InPerson] on the enum `OrderSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [Dispatched] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `orderType` on the `OrderRequest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('PickupAtStore', 'InStore', 'Delivery');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderSource_new" AS ENUM ('App', 'WhatsApp', 'Instagram', 'Call', 'Local', 'Ifood');
ALTER TABLE "OrderRequest" ALTER COLUMN "orderSource" TYPE "OrderSource_new" USING ("orderSource"::text::"OrderSource_new");
ALTER TYPE "OrderSource" RENAME TO "OrderSource_old";
ALTER TYPE "OrderSource_new" RENAME TO "OrderSource";
DROP TYPE "OrderSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('Draft', 'Placed', 'Confirmed', 'PickedUp', 'Preparing', 'ReadyToPickup', 'OutForDelivery', 'Delivered', 'DeliverFailed', 'Concluded', 'Cancelled');
ALTER TABLE "OrderRequest" ALTER COLUMN "orderStatus" DROP DEFAULT;
ALTER TABLE "OrderRequest" ALTER COLUMN "orderStatus" TYPE "OrderStatus_new" USING ("orderStatus"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "OrderRequest" ALTER COLUMN "orderStatus" SET DEFAULT 'Confirmed';
COMMIT;

-- AlterTable
ALTER TABLE "OrderRequest" DROP COLUMN "orderType",
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'InStore';

-- AlterTable
ALTER TABLE "OrderTransaction" ALTER COLUMN "transactionType" DROP NOT NULL;

-- DropEnum
DROP TYPE "OrderType";
