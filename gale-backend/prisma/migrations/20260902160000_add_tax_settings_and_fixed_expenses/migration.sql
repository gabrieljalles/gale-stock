-- Simples Nacional nas configurações. Desligado => imposto zerado na DRE.
ALTER TABLE "SiteSettings" ADD COLUMN "simplesNacionalEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "SiteSettings" ADD COLUMN "taxDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Despesas fixas por mês de competência.
CREATE TYPE "FixedExpenseType" AS ENUM ('Energy', 'Water', 'Rent');

CREATE TABLE "FixedExpense" (
    "id" TEXT NOT NULL,
    "type" "FixedExpenseType" NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- Uma despesa de cada tipo por mês: duplicata dobraria a dedução na DRE.
CREATE UNIQUE INDEX "FixedExpense_type_referenceYear_referenceMonth_key"
    ON "FixedExpense"("type", "referenceYear", "referenceMonth");
