import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FixedExpenseType, Prisma } from '@prisma/client';
import { FinanceRepository } from './finance.repository';
import { SettingsService } from 'src/settings/settings.service';
import {
  calculateSimplesNacional,
  proportionalizeRbt12,
} from 'src/utils/simples-nacional.utils';
import { UpsertFixedExpenseDto } from './dto/fixed-expense.dto';

const ZERO = new Prisma.Decimal(0);

const toNumber = (value: Prisma.Decimal): number =>
  Number(value.toDecimalPlaces(2));

@Injectable()
export class FinanceService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly settingsService: SettingsService,
  ) {}

  // ---------- Despesas fixas ----------

  async findExpenses(year: number, month: number) {
    this.assertCompetence(year, month);
    const expenses = await this.repository.findExpensesByMonth(year, month);

    return expenses.map((expense) => ({
      id: expense.id,
      type: expense.type,
      referenceYear: expense.referenceYear,
      referenceMonth: expense.referenceMonth,
      amount: Number(expense.amount),
      note: expense.note,
    }));
  }

  async upsertExpense(dto: UpsertFixedExpenseDto) {
    this.assertCompetence(dto.referenceYear, dto.referenceMonth);

    const expense = await this.repository.upsertExpense({
      type: dto.type,
      referenceYear: dto.referenceYear,
      referenceMonth: dto.referenceMonth,
      amount: new Prisma.Decimal(dto.amount),
      note: dto.note?.trim() || null,
    });

    return { id: expense.id, amount: Number(expense.amount) };
  }

  async deleteExpense(id: string) {
    const expense = await this.repository.findExpenseById(id);
    if (!expense) throw new NotFoundException('Despesa não encontrada.');

    await this.repository.deleteExpense(id);
    return { deleted: true };
  }

  /** Competências que já têm movimento, pro seletor de mês da tela. */
  async findAvailableMonths() {
    const rows = await this.repository.findMonthsWithActivity();
    const now = new Date();
    const current = { year: now.getFullYear(), month: now.getMonth() + 1 };

    // O mês corrente sempre aparece, mesmo zerado: é onde o usuário vai
    // querer lançar a primeira despesa.
    const hasCurrent = rows.some(
      (row) => row.year === current.year && row.month === current.month,
    );

    const months = hasCurrent ? rows : [current, ...rows];

    return months
      .map((row) => ({ year: Number(row.year), month: Number(row.month) }))
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }

  // ---------- DRE ----------

  /**
   * Demonstração do Resultado do Exercício de uma competência mensal.
   *
   * O imposto entra SÓ aqui, no fechamento do mês — nunca na venda
   * individual, porque a alíquota efetiva do Simples depende da receita
   * acumulada de 12 meses, que só existe olhando o conjunto.
   */
  async getIncomeStatement(year: number, month: number) {
    this.assertCompetence(year, month);

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const settings = await this.settingsService.getSettings();
    const transactions = await this.repository.findPaidTransactionsBetween(
      start,
      end,
    );

    const grossRevenue = transactions.reduce(
      (sum, tx) => sum.add(tx.totalPrice),
      ZERO,
    );
    const cardFees = transactions.reduce((sum, tx) => sum.add(tx.feeAmount), ZERO);
    const freightRevenue = transactions.reduce(
      (sum, tx) => sum.add(tx.freightPrice),
      ZERO,
    );
    const interestRevenue = transactions.reduce(
      (sum, tx) => sum.add(tx.interestAmount),
      ZERO,
    );

    // ----- Imposto sobre vendas -----
    // Desligado o Simples, a linha existe zerada de propósito: some da
    // conta mas continua visível, pra ficar claro que não foi esquecida.
    let salesTax = ZERO;
    let effectiveTaxRate = ZERO;
    let rbt12 = ZERO;

    if (settings.simplesNacionalEnabled) {
      const monthlyRevenues = await this.repository.findMonthlyRevenueUntil(
        start,
      );
      // Só os 12 meses imediatamente anteriores entram na RBT12.
      const lastTwelve = monthlyRevenues.slice(-12).map((row) => row.total);

      rbt12 = proportionalizeRbt12(lastTwelve);

      const result = calculateSimplesNacional({
        monthlyRevenue: grossRevenue,
        rbt12,
        taxPercent: settings.taxPercent,
        taxDeduction: settings.taxDeduction,
      });

      salesTax = result.taxAmount;
      effectiveTaxRate = result.effectiveRatePercent;
    }

    const netRevenue = grossRevenue.sub(cardFees).sub(salesTax);

    // ----- CMV -----
    const orderIds = Array.from(new Set(transactions.map((tx) => tx.orderId)));
    const costOfGoods = await this.repository.sumCostOfGoodsForOrders(orderIds);

    const grossProfit = netRevenue.sub(costOfGoods);

    // ----- Despesas fixas -----
    const expenses = await this.repository.findExpensesByMonth(year, month);
    const fixedExpensesTotal = expenses.reduce(
      (sum, expense) => sum.add(expense.amount),
      ZERO,
    );

    const netProfit = grossProfit.sub(fixedExpensesTotal);

    const margin = (value: Prisma.Decimal): number =>
      grossRevenue.gt(0)
        ? Number(value.div(grossRevenue).mul(100).toDecimalPlaces(2))
        : 0;

    return {
      year,
      month,
      orderCount: orderIds.length,

      grossRevenue: toNumber(grossRevenue),
      freightRevenue: toNumber(freightRevenue),
      interestRevenue: toNumber(interestRevenue),

      cardFees: toNumber(cardFees),
      salesTax: toNumber(salesTax),
      netRevenue: toNumber(netRevenue),

      costOfGoods: toNumber(costOfGoods),
      grossProfit: toNumber(grossProfit),

      fixedExpenses: expenses.map((expense) => ({
        id: expense.id,
        type: expense.type,
        amount: Number(expense.amount),
        note: expense.note,
      })),
      fixedExpensesTotal: toNumber(fixedExpensesTotal),

      netProfit: toNumber(netProfit),

      // Contexto do imposto, pra tela conseguir explicar de onde saiu.
      tax: {
        simplesNacionalEnabled: settings.simplesNacionalEnabled,
        nominalRatePercent: Number(settings.taxPercent),
        deduction: Number(settings.taxDeduction),
        effectiveRatePercent: Number(effectiveTaxRate),
        rbt12: toNumber(rbt12),
      },

      margins: {
        grossProfitPercent: margin(grossProfit),
        netProfitPercent: margin(netProfit),
      },
    };
  }

  private assertCompetence(year: number, month: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Ano inválido.');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Mês inválido.');
    }
  }
}
