import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  private sinceDate(days: number): Date {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    return since;
  }

  // Agrupa linhas de venda por dia (calendário), somando preço e custo,
  // e calcula a margem ponderada pelo faturamento de cada dia — não é a
  // média simples das margens individuais, que distorceria o resultado.
  private groupByDay(
    rows: { totalPrice: any; totalCost: any; order: { createdAT: Date } }[],
  ) {
    const byDay = new Map<string, { totalPrice: number; totalCost: number }>();

    for (const row of rows) {
      const key = toDateKey(row.order.createdAT);
      const current = byDay.get(key) ?? { totalPrice: 0, totalCost: 0 };
      current.totalPrice += Number(row.totalPrice);
      current.totalCost += Number(row.totalCost ?? 0);
      byDay.set(key, current);
    }

    return Array.from(byDay.entries())
      .map(([date, { totalPrice, totalCost }]) => ({
        date,
        totalPrice,
        totalCost,
        marginPercent:
          totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Chart 2: margem média (ponderada) de toda a loja, por dia.
  async getMarginTrend(days: number) {
    const rows = await this.repository.findOrderDetailsSince(
      this.sinceDate(days),
    );

    return this.groupByDay(rows).map(({ date, marginPercent }) => ({
      date,
      marginPercent,
    }));
  }

  // Chart 3: venda, custo e margem de um produto específico, por dia.
  async getProductMarginTrend(productId: string, days: number) {
    const rows = await this.repository.findOrderDetailsSince(
      this.sinceDate(days),
      productId,
    );

    return this.groupByDay(rows);
  }
}
