import { Injectable } from '@nestjs/common';
import { WorkDayRepository } from './work-day.repository';

@Injectable()
export class WorkDayService {
  constructor(private readonly repository: WorkDayRepository) {}

  // Abre um novo dia de trabalho e resgata vendas feitas enquanto a loja
  // estava fechada (workDayId nulo) para esse dia. Se já existe um dia
  // aberto, não cria outro (evita duplicar ao clicar duas vezes).
  async openStore(openedBy?: string) {
    const existing = await this.repository.findOpenWorkDay();
    if (existing) return existing;

    const workDay = await this.repository.createWorkDay(openedBy);
    await this.repository.attachPendingOrders(workDay.id);
    return workDay;
  }

  async closeStore(closedBy?: string) {
    const open = await this.repository.findOpenWorkDay();
    if (!open) return null;
    return this.repository.closeWorkDay(open.id, closedBy);
  }

  async findOpenWorkDayId(): Promise<string | null> {
    const open = await this.repository.findOpenWorkDay();
    return open?.id ?? null;
  }

  // Produtos mais vendidos (em quantidade) do dia de trabalho em aberto.
  async getCurrentTopProducts() {
    const workDay = await this.repository.findOpenWorkDayWithOrderDetails();
    if (!workDay) return [];

    const byProduct = new Map<string, number>();

    for (const order of workDay.orders ?? []) {
      for (const detail of order.orderDetails ?? []) {
        byProduct.set(
          detail.productName,
          (byProduct.get(detail.productName) ?? 0) + detail.quantity,
        );
      }
    }

    return Array.from(byProduct.entries())
      .map(([productName, quantity]) => ({ productName, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);
  }

  async getWorkDaysReport() {
    const workDays = await this.repository.findAllWithOrders();

    return workDays.map((workDay) => {
      const orders = workDay.orders ?? [];

      const totalRevenue = orders.reduce((sum, order) => {
        const orderTotal = (order.orderTransaction ?? []).reduce(
          (txSum, tx) => txSum + Number(tx.totalPrice),
          0,
        );
        return sum + orderTotal;
      }, 0);

      // Parte do faturamento que veio de frete (serviço), separado do
      // valor de produto — só pedidos Delivery têm freightPrice > 0.
      const totalFreightRevenue = orders.reduce((sum, order) => {
        const orderFreight = (order.orderTransaction ?? []).reduce(
          (txSum, tx) => txSum + Number(tx.freightPrice),
          0,
        );
        return sum + orderFreight;
      }, 0);

      // Juros/multa recebido ao fechar notinhas atrasadas — já está
      // incluído no totalRevenue, mas fica destacado à parte aqui.
      const totalInterestReceived = orders.reduce((sum, order) => {
        const orderInterest = (order.orderTransaction ?? []).reduce(
          (txSum, tx) => txSum + Number(tx.interestAmount ?? 0),
          0,
        );
        return sum + orderInterest;
      }, 0);

      // Lucro = preço de venda - custo (landedUnitCost) dos lotes baixados,
      // somado por linha de produto vendida nesse dia.
      const totalProfit = orders.reduce((sum, order) => {
        const orderProfit = (order.orderDetails ?? []).reduce(
          (detailSum, detail) =>
            detailSum +
            (Number(detail.totalPrice) - Number(detail.totalCost ?? 0)),
          0,
        );
        return sum + orderProfit;
      }, 0);

      const durationMinutes = workDay.closedAt
        ? Math.round(
            (workDay.closedAt.getTime() - workDay.openedAt.getTime()) / 60000,
          )
        : null;

      return {
        id: workDay.id,
        openedAt: workDay.openedAt,
        closedAt: workDay.closedAt,
        openedBy: workDay.openedBy,
        closedBy: workDay.closedBy,
        isOpen: workDay.closedAt == null,
        orderCount: orders.length,
        totalRevenue,
        totalFreightRevenue,
        totalInterestReceived,
        totalProfit,
        averageTicket: orders.length > 0 ? totalRevenue / orders.length : 0,
        durationMinutes,
      };
    });
  }
}
