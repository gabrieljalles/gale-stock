-- AlterTable: add productName as nullable first so existing rows are valid
ALTER TABLE "StockEntryDetail" ADD COLUMN "productName" TEXT;
ALTER TABLE "LostEntry" ADD COLUMN "productName" TEXT;
ALTER TABLE "OrderDetail" ADD COLUMN "productName" TEXT;

-- Backfill existing rows with the current product name
UPDATE "StockEntryDetail" sed
SET "productName" = p."name"
FROM "Product" p
WHERE p."id" = sed."productId";

UPDATE "LostEntry" le
SET "productName" = p."name"
FROM "Product" p
WHERE p."id" = le."productId";

-- OrderDetail.productId references Catalog.id, which shares its primary key with Product.id
UPDATE "OrderDetail" od
SET "productName" = p."name"
FROM "Product" p
WHERE p."id" = od."productId";

-- Enforce NOT NULL now that every row has a value
ALTER TABLE "StockEntryDetail" ALTER COLUMN "productName" SET NOT NULL;
ALTER TABLE "LostEntry" ALTER COLUMN "productName" SET NOT NULL;
ALTER TABLE "OrderDetail" ALTER COLUMN "productName" SET NOT NULL;
