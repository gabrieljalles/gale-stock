ALTER TABLE "SiteSettings" ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OrderAddress" ADD COLUMN "recipientName" TEXT;
