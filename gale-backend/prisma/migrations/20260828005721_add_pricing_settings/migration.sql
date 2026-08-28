-- AlterTable
ALTER TABLE "SiteSettings"
  ADD COLUMN "nightPriceMarkupPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
  ADD COLUMN "ifoodMarkupPercent" DECIMAL(5,2) NOT NULL DEFAULT 27,
  ADD COLUMN "freightPrice" DECIMAL(10,2) NOT NULL DEFAULT 5;
