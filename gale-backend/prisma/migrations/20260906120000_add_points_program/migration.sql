-- ============================================================
-- PROGRAMA DE PONTOS
-- ============================================================

CREATE TYPE "PointsEntryType" AS ENUM ('Earn', 'Redeem', 'Expire', 'InactivityReset', 'Reversal');

-- ---------- Configuração única do programa ----------
CREATE TABLE "PointsSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "moneyRate" DECIMAL(6,4) NOT NULL DEFAULT 1,
    "pixRate" DECIMAL(6,4) NOT NULL DEFAULT 0.99,
    "creditRate" DECIMAL(6,4) NOT NULL DEFAULT 0.95,
    "debitRate" DECIMAL(6,4) NOT NULL DEFAULT 0.95,
    "onTheBillGraceDays" INTEGER NOT NULL DEFAULT 5,
    "mlmEnabled" BOOLEAN NOT NULL DEFAULT true,
    "selfMultiplier" DECIMAL(6,4) NOT NULL DEFAULT 1,
    "level2Multiplier" DECIMAL(6,4) NOT NULL DEFAULT 0.5,
    "level3Multiplier" DECIMAL(6,4) NOT NULL DEFAULT 0.25,
    "level4Multiplier" DECIMAL(6,4) NOT NULL DEFAULT 0.1,
    "tiersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "activeAffiliateWindowDays" INTEGER NOT NULL DEFAULT 90,
    "pointsPerReal" INTEGER NOT NULL DEFAULT 100,
    "minRedeemPoints" INTEGER NOT NULL DEFAULT 100,
    "maxRedeemPercent" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "expirationDays" INTEGER NOT NULL DEFAULT 365,
    "inactivityDays" INTEGER NOT NULL DEFAULT 90,
    "maxCashbackPercent" DECIMAL(5,2) NOT NULL DEFAULT 4,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointsSettings_pkey" PRIMARY KEY ("id")
);

-- ---------- Escada de tiers ----------
CREATE TABLE "PointsTier" (
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "multiplier" DECIMAL(6,4) NOT NULL,
    "minActiveAffiliates" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointsTier_pkey" PRIMARY KEY ("level")
);

-- ---------- Extrato / lotes de pontos ----------
CREATE TABLE "PointsEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PointsEntryType" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "remaining" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "sourceLevel" INTEGER,
    "sourceUserId" TEXT,
    "orderId" TEXT,
    "orderTransactionId" TEXT,
    "basisAmount" DECIMAL(10,4),
    "paymentRate" DECIMAL(6,4),
    "levelMultiplier" DECIMAL(6,4),
    "tierMultiplier" DECIMAL(6,4),
    "tierLevel" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointsEntry_userId_createdAt_idx" ON "PointsEntry"("userId", "createdAt");
CREATE INDEX "PointsEntry_userId_type_idx" ON "PointsEntry"("userId", "type");
CREATE INDEX "PointsEntry_expiresAt_idx" ON "PointsEntry"("expiresAt");

-- Trava contra pontuar duas vezes o mesmo recebimento. Linhas sem
-- transação (expiração, inatividade) ficam livres: NULL não colide com NULL.
CREATE UNIQUE INDEX "PointsEntry_orderTransactionId_userId_type_key"
    ON "PointsEntry"("orderTransactionId", "userId", "type");

ALTER TABLE "PointsEntry" ADD CONSTRAINT "PointsEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointsEntry" ADD CONSTRAINT "PointsEntry_sourceUserId_fkey"
    FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Indicação e saldo no usuário ----------
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;
ALTER TABLE "User" ADD COLUMN "referredAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "pointsBalance" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastPurchaseAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
    FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Resgate na venda ----------
ALTER TABLE "OrderTransaction" ADD COLUMN "pointsRedeemed" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "OrderTransaction" ADD COLUMN "pointsDiscountAmount" DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE "OrderTransaction" ADD COLUMN "pointsAwarded" DECIMAL(14,4) NOT NULL DEFAULT 0;

-- ---------- Semente: configuração e escada padrão ----------
INSERT INTO "PointsSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PointsTier" ("level", "name", "multiplier", "minActiveAffiliates", "updatedAt") VALUES
    (0, 'Recruta dos Cervejeiros', 0.99, 0, CURRENT_TIMESTAMP),
    (1, 'Aprendiz da Taberna', 1.00, 1, CURRENT_TIMESTAMP),
    (2, 'Sommelier de Lúpulo', 1.20, 3, CURRENT_TIMESTAMP),
    (3, 'Mestre Cervejeiro', 1.40, 10, CURRENT_TIMESTAMP),
    (4, 'Guardião do Barril', 1.50, 20, CURRENT_TIMESTAMP),
    (5, 'Barão do Malte', 1.60, 30, CURRENT_TIMESTAMP),
    (6, 'Comandante de uma Legião de Cervejeiros', 2.00, 50, CURRENT_TIMESTAMP)
    ON CONFLICT ("level") DO NOTHING;

-- Quem já comprava antes do programa não fica marcado como inativo no
-- primeiro cron: a última compra paga vira o ponto de partida.
UPDATE "User" u SET "lastPurchaseAt" = sub."paidDate"
FROM (
    SELECT o."clientId" AS "clientId", MAX(t."paidDate") AS "paidDate"
    FROM "OrderTransaction" t
    JOIN "Order" o ON o."id" = t."orderId"
    WHERE t."isPaid" = true AND t."paidDate" IS NOT NULL AND o."clientId" IS NOT NULL
    GROUP BY o."clientId"
) sub
WHERE u."id" = sub."clientId";
