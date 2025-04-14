-- AlterTable
ALTER TABLE "Catalog" ALTER COLUMN "finalConsumerPrice" DROP NOT NULL,
ALTER COLUMN "finalIfoodConsumerPrice" DROP NOT NULL,
ALTER COLUMN "discountPrice" DROP NOT NULL,
ALTER COLUMN "quantityDiscount" DROP NOT NULL,
ALTER COLUMN "discountQtdPrice" DROP NOT NULL,
ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "available" SET DEFAULT false;
