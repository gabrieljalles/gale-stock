import { Injectable } from '@nestjs/common';
import { FixedExpenseType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Despesas fixas ----------

  async findExpensesByMonth(year: number, month: number) {
    return this.prisma.fixedExpense.findMany({
      where: { referenceYear: year, referenceMonth: month },
      orderBy: { type: 'asc' },
    });
  }

  // Upsert em cima da chave (tipo + mês): salvar de novo corrige o valor
  // em vez de criar uma segunda linha de energia no mesmo mês.
  async upsertExpense(data: {
    type: FixedExpenseType;
    referenceYear: number;
    referenceMonth: number;
    amount: Prisma.Decimal;
    note?: string | null;
  }) {
    return this.prisma.fixedExpense.upsert({
      where: {
        type_referenceYear_referenceMonth: {
          type: data.type,
          referenceYear: data.referenceYear,
          referenceMonth: data.referenceMonth,
        },
      },
      create: data,
      update: { amount: data.amount, note: data.note },
    });
  }

  async deleteExpense(id: string) {
    return this.prisma.fixedExpense.delete({ where: { id } });
  }

  async findExpenseById(id: string) {
    return this.prisma.fixedExpense.findUnique({ where: { id } });
  }

  async sumExpensesByMonth(year: number, month: number) {
    const result = await this.prisma.fixedExpense.aggregate({
      where: { referenceYear: year, referenceMonth: month },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // ---------- Apuração ----------

  /**
   * Transações recebidas dentro do intervalo, pela data de PAGAMENTO.
   *
   * Regime de caixa: a venda entra na competência em que o dinheiro
   * entrou, não em que a mercadoria saiu. É o mesmo critério que o resto do
   * sistema já usa (Resumo e Dashboard contam só transação paga), então
   * misturar critérios aqui faria as telas se contradizerem.
   */
  async findPaidTransactionsBetween(start: Date, end: Date) {
    return this.prisma.orderTransaction.findMany({
      where: { isPaid: true, paidDate: { gte: start, lt: end } },
      select: {
        totalPrice: true,
        feeAmount: true,
        freightPrice: true,
        interestAmount: true,
        transactionType: true,
        orderId: true,
      },
    });
  }

  /** Custo das mercadorias (CMV) dos pedidos informados. */
  async sumCostOfGoodsForOrders(orderIds: string[]) {
    if (orderIds.length === 0) return new Prisma.Decimal(0);

    const result = await this.prisma.orderDetail.aggregate({
      where: { orderId: { in: orderIds } },
      _sum: { totalCost: true },
    });
    return result._sum.totalCost ?? new Prisma.Decimal(0);
  }

  /**
   * Receita bruta recebida mês a mês, do mais antigo pro mais recente.
   * Base da RBT12 do Simples Nacional.
   */
  async findMonthlyRevenueUntil(end: Date) {
    const rows = await this.prisma.$queryRaw<
      { year: number; month: number; total: Prisma.Decimal }[]
    >`
      SELECT
        EXTRACT(YEAR FROM "paidDate")::int  AS year,
        EXTRACT(MONTH FROM "paidDate")::int AS month,
        SUM("totalPrice")                   AS total
      FROM "OrderTransaction"
      WHERE "isPaid" = true AND "paidDate" IS NOT NULL AND "paidDate" < ${end}
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;
    return rows;
  }

  /** Meses que já têm movimento — alimenta o seletor de competência. */
  async findMonthsWithActivity() {
    return this.prisma.$queryRaw<{ year: number; month: number }[]>`
      SELECT DISTINCT
        EXTRACT(YEAR FROM "paidDate")::int  AS year,
        EXTRACT(MONTH FROM "paidDate")::int AS month
      FROM "OrderTransaction"
      WHERE "isPaid" = true AND "paidDate" IS NOT NULL
      UNION
      SELECT DISTINCT "referenceYear" AS year, "referenceMonth" AS month
      FROM "FixedExpense"
      ORDER BY 1 DESC, 2 DESC
    `;
  }
}
