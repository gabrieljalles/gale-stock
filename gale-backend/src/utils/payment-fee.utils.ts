import { Prisma, TransactionType } from '@prisma/client';

/**
 * Taxas de recebimento (maquininha/operadora).
 *
 * A conta é a da maquininha: a taxa incide SOBRE o valor da venda e sai do
 * que o lojista recebe. Vendeu R$ 100 no crédito a 3,5% -> entram R$ 96,50.
 *
 *     liquido = total * (1 - taxa/100)
 *
 * Isso NÃO é markup. Markup seria aumentar o preço pra "repassar" a taxa
 * (R$ 100 / (1 - 0,035) = R$ 103,63) — outra conta, outro propósito.
 */

// Só os métodos com taxa configurável entram aqui. Dinheiro não tem custo
// de recebimento, e Boleto não tem campo nas configurações — ambos ficam
// de fora e resolvem para 0.
type FeeSettings = {
  creditCardFeePercent: Prisma.Decimal | number;
  debitCardFeePercent: Prisma.Decimal | number;
  pixFeePercent: Prisma.Decimal | number;
};

/**
 * Alíquota vigente para um método de pagamento.
 *
 * `OnTheBill` resolve para 0 de propósito: notinha não é forma de
 * recebimento, é uma dívida em aberto. A taxa só nasce quando a conta é
 * fechada de fato — aí o método real (crédito, débito, Pix...) é gravado
 * na transação e esta função é chamada com ele.
 */
export function resolveFeePercent(
  transactionType: TransactionType | null | undefined,
  settings: FeeSettings,
): Prisma.Decimal {
  switch (transactionType) {
    case TransactionType.CreditCard:
      return new Prisma.Decimal(settings.creditCardFeePercent);
    case TransactionType.DebitCard:
      return new Prisma.Decimal(settings.debitCardFeePercent);
    case TransactionType.Pix:
      return new Prisma.Decimal(settings.pixFeePercent);
    default:
      return new Prisma.Decimal(0);
  }
}

/**
 * Quanto a operadora fica e quanto sobra, dado um total e uma alíquota.
 *
 * Arredonda para centavos porque é dinheiro que sai de verdade: deixar a
 * fração correr solta faria a soma dos líquidos não bater com o extrato.
 */
export function applyPaymentFee(
  totalPrice: Prisma.Decimal | number,
  feePercent: Prisma.Decimal | number,
): { feeAmount: Prisma.Decimal; netPrice: Prisma.Decimal } {
  const total = new Prisma.Decimal(totalPrice);
  const percent = new Prisma.Decimal(feePercent);

  if (percent.lte(0) || total.lte(0)) {
    return { feeAmount: new Prisma.Decimal(0), netPrice: total };
  }

  const feeAmount = total
    .mul(percent)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return { feeAmount, netPrice: total.sub(feeAmount) };
}

/**
 * Atalho: resolve a alíquota e já aplica. Devolve os três valores que a
 * transação precisa gravar.
 */
export function calculatePaymentFee(
  totalPrice: Prisma.Decimal | number,
  transactionType: TransactionType | null | undefined,
  settings: FeeSettings,
): {
  feePercent: Prisma.Decimal;
  feeAmount: Prisma.Decimal;
  netPrice: Prisma.Decimal;
} {
  const feePercent = resolveFeePercent(transactionType, settings);
  const { feeAmount, netPrice } = applyPaymentFee(totalPrice, feePercent);
  return { feePercent, feeAmount, netPrice };
}
