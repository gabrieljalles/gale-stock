-- Grade semanal de funcionamento, substituindo o fechamento por hora única.
CREATE TYPE "StoreOverride" AS ENUM ('ForceOpen', 'ForceClose');

ALTER TABLE "SiteSettings" ADD COLUMN "autoScheduleEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "storeOverride" "StoreOverride";
ALTER TABLE "SiteSettings" ADD COLUMN "overrideUntil" TIMESTAMP(3);

CREATE TABLE "StoreSchedule" (
    "weekday" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openHour" INTEGER NOT NULL DEFAULT 8,
    "openMinute" INTEGER NOT NULL DEFAULT 0,
    "closeHour" INTEGER NOT NULL DEFAULT 22,
    "closeMinute" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSchedule_pkey" PRIMARY KEY ("weekday")
);

-- Carrega a configuração antiga: quem tinha fechamento automático ligado
-- continua com automação ligada.
UPDATE "SiteSettings" SET "autoScheduleEnabled" = "autoCloseEnabled";

-- Semeia os 7 dias reaproveitando a hora de fechamento já configurada,
-- pra loja não mudar de comportamento sozinha na hora do deploy.
INSERT INTO "StoreSchedule"
    ("weekday", "isOpen", "openHour", "openMinute", "closeHour", "closeMinute", "updatedAt")
SELECT
    g.weekday,
    true,
    8,
    0,
    COALESCE((SELECT "storeCloseHour" FROM "SiteSettings" LIMIT 1), 22),
    0,
    CURRENT_TIMESTAMP
FROM generate_series(0, 6) AS g(weekday);

-- Totalmente substituídas pela grade acima.
ALTER TABLE "SiteSettings" DROP COLUMN "autoCloseEnabled";
ALTER TABLE "SiteSettings" DROP COLUMN "storeCloseHour";
