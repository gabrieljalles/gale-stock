import { Prisma } from '@prisma/client';

/**
 * Simples Nacional.
 *
 * A alíquota que aparece na tabela do anexo NÃO é a que se paga. A conta
 * oficial é:
 *
 *     alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12
 *     DAS do mês       = receita do mês × alíquota efetiva
 *
 * RBT12 é a receita bruta acumulada dos 12 meses ANTERIORES ao mês apurado.
 *
 * É por isso que a parcela a deduzir não pode ser subtraída do faturamento
 * de um mês só: ela foi calibrada para 12 meses de receita. Aplicada a um
 * mês isolado ela engole o imposto inteiro e o resultado dá zero — que é
 * exatamente o erro que este arquivo existe para evitar.
 */

export interface SimplesNacionalInput {
  /** Receita bruta do mês que está sendo apurado. */
  monthlyRevenue: Prisma.Decimal | number;
  /** Receita bruta dos 12 meses anteriores (RBT12). */
  rbt12: Prisma.Decimal | number;
  /** Alíquota nominal da faixa, em % (ex.: 7.30). */
  taxPercent: Prisma.Decimal | number;
  /** Parcela a deduzir da faixa, em reais (ex.: 5940). */
  taxDeduction: Prisma.Decimal | number;
}

export interface SimplesNacionalResult {
  /** Alíquota efetiva resultante, em % — o que realmente se paga. */
  effectiveRatePercent: Prisma.Decimal;
  /** Imposto do mês. */
  taxAmount: Prisma.Decimal;
  /** RBT12 usada, já proporcionalizada se a loja tem menos de 12 meses. */
  rbt12Used: Prisma.Decimal;
}

const ZERO = new Prisma.Decimal(0);

export function calculateSimplesNacional(
  input: SimplesNacionalInput,
): SimplesNacionalResult {
  const monthlyRevenue = new Prisma.Decimal(input.monthlyRevenue);
  const rbt12 = new Prisma.Decimal(input.rbt12);
  const nominalRate = new Prisma.Decimal(input.taxPercent);
  const deduction = new Prisma.Decimal(input.taxDeduction);

  // Sem receita acumulada não há base: primeira competência da loja, ou
  // nenhuma venda registrada ainda.
  if (rbt12.lte(0) || monthlyRevenue.lte(0) || nominalRate.lte(0)) {
    return {
      effectiveRatePercent: ZERO,
      taxAmount: ZERO,
      rbt12Used: rbt12,
    };
  }

  const grossTax = rbt12.mul(nominalRate).div(100);
  const netTax = grossTax.sub(deduction);

  // Parcela a deduzir maior que o imposto nominal significa faixa
  // configurada errada (a parcela de uma faixa alta com receita de faixa
  // baixa). Trava em 0 em vez de gerar imposto negativo.
  if (netTax.lte(0)) {
    return {
      effectiveRatePercent: ZERO,
      taxAmount: ZERO,
      rbt12Used: rbt12,
    };
  }

  const effectiveRatePercent = netTax
    .div(rbt12)
    .mul(100)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

  const taxAmount = monthlyRevenue
    .mul(effectiveRatePercent)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return { effectiveRatePercent, taxAmount, rbt12Used: rbt12 };
}

/**
 * RBT12 de uma loja com menos de 12 meses de histórico.
 *
 * A regra do Simples manda proporcionalizar: pega a média mensal do que
 * existe e projeta para 12 meses. Sem isso, uma loja com 3 meses de vida
 * teria uma RBT12 artificialmente baixa e cairia numa faixa que não é a
 * dela.
 */
export function proportionalizeRbt12(
  revenueByMonth: (Prisma.Decimal | number)[],
): Prisma.Decimal {
  const months = revenueByMonth.length;
  if (months === 0) return ZERO;

  const total = revenueByMonth.reduce<Prisma.Decimal>(
    (sum, value) => sum.add(new Prisma.Decimal(value)),
    ZERO,
  );

  if (months >= 12) return total;

  return total.div(months).mul(12).toDecimalPlaces(2);
}
