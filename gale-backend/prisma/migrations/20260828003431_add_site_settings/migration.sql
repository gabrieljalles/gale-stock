-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nightPriceStartHour" INTEGER NOT NULL DEFAULT 23,
    "nightPriceEndHour" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the single settings row
INSERT INTO "SiteSettings" ("id", "nightPriceStartHour", "nightPriceEndHour", "updatedAt")
VALUES (1, 23, 7, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
