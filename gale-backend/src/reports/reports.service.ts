import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { WorkDayService } from 'src/work-day/work-day.service';

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly workDayService: WorkDayService,
  ) {}

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

  // Chart 4: quanto entrou por forma de pagamento (pizza).
  //
  // `total` é o bruto vendido; `net` é o que sobra depois da taxa da
  // maquininha. Formas sem taxa (dinheiro) têm os dois iguais, e é
  // justamente a comparação que mostra o custo de cada meio.
  async getSalesByPaymentMethod(workDayId?: string) {
    const rows = await this.repository.groupPaidTransactionsByType(workDayId);

    return rows
      .filter((row) => row.transactionType != null)
      .map((row) => {
        const total = Number(row._sum.totalPrice ?? 0);
        const fee = Number(row._sum.feeAmount ?? 0);

        return {
          transactionType: row.transactionType as string,
          total,
          fee,
          net: total - fee,
          orderCount: row._count._all,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  // Mesma pizza, recortada no dia de trabalho aberto (indicador do Resumo).
  // Loja fechada não tem dia aberto — devolve vazio em vez de somar tudo,
  // que é o que aconteceria se o filtro simplesmente sumisse.
  async getTodaySalesByPaymentMethod() {
    const workDayId = await this.workDayService.findOpenWorkDayId();
    if (!workDayId) return [];
    return this.getSalesByPaymentMethod(workDayId);
  }
}
