import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Linhas de venda (com custo) desde `since`, opcionalmente de um único
  // produto. Cada linha traz a data do pedido pra ser agrupada por dia
  // depois, no service.
  async findOrderDetailsSince(since: Date, productId?: string) {
    return this.prisma.orderDetail.findMany({
      where: {
        order: { createdAT: { gte: since } },
        ...(productId && { productId }),
      },
      select: {
        totalPrice: true,
        totalCost: true,
        order: { select: { createdAT: true } },
      },
    });
  }

  // Transações efetivamente recebidas, por forma de pagamento. Só entram
  // as pagas: notinha em aberto ainda não é dinheiro no caixa.
  // `workDayId` restringe ao dia de trabalho informado.
  async groupPaidTransactionsByType(workDayId?: string) {
    return this.prisma.orderTransaction.groupBy({
      by: ['transactionType'],
      where: {
        isPaid: true,
        ...(workDayId && { order: { workDayId } }),
      },
      _sum: { totalPrice: true, feeAmount: true },
      _count: { _all: true },
    });
  }
}
