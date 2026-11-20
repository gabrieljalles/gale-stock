-- Teto padrão de notinha da loja, para clientes sem limite próprio.
ALTER TABLE "SiteSettings" ADD COLUMN "defaultOnTheBillLimit" DECIMAL(10,2) NOT NULL DEFAULT 200;

-- Limite individual. NULL = herda o padrão da loja, para que aumentar o
-- padrão beneficie todo mundo que nunca foi ajustado à mão.
ALTER TABLE "User" ADD COLUMN "onTheBillLimit" DECIMAL(10,2);
