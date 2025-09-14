/*
  Warnings:

  - The values [DamegedProduct,CustomerReturn,Operacional] on the enum `ReasonLoss` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReasonLoss_new" AS ENUM ('Theft', 'DamagedProduct', 'Expiration', 'Loss');
ALTER TABLE "LostEntry" ALTER COLUMN "reasonLoss" TYPE "ReasonLoss_new" USING ("reasonLoss"::text::"ReasonLoss_new");
ALTER TYPE "ReasonLoss" RENAME TO "ReasonLoss_old";
ALTER TYPE "ReasonLoss_new" RENAME TO "ReasonLoss";
DROP TYPE "ReasonLoss_old";
COMMIT;

-- AlterTable
ALTER TABLE "LostEntry" ALTER COLUMN "stockEntryDetailId" DROP DEFAULT;
