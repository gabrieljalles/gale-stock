-- Taxa da maquininha/operadora congelada na própria transação.
-- feePercent guarda a alíquota vigente no momento em que o pagamento foi
-- registrado: mudar a taxa nas configurações não pode reescrever o
-- histórico financeiro já fechado.
ALTER TABLE "OrderTransaction" ADD COLUMN "feePercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "OrderTransaction" ADD COLUMN "feeAmount" DECIMAL(10,4) NOT NULL DEFAULT 0;
