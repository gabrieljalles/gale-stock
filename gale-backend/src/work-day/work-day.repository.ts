import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkDayRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOpenWorkDay(tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.workDay.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
  }

  async createWorkDay(openedBy?: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.workDay.create({
      data: { openedBy },
    });
  }

  async closeWorkDay(
    id: string,
    closedBy?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.workDay.update({
      where: { id },
      data: { closedAt: new Date(), closedBy },
    });
  }

  // Vendas feitas com a loja fechada (só Admin) ficam sem workDayId até
  // a loja abrir de novo; aqui elas são "resgatadas" para o dia que
  // acabou de abrir.
  async attachPendingOrders(workDayId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.order.updateMany({
      where: { workDayId: null },
      data: { workDayId },
    });
  }

  // Só entram vendas já pagas — notinhas em aberto ficam de fora dos
  // relatórios do dia até serem fechadas (ver OrderService.closeTab).
  async findOpenWorkDayWithOrderDetails() {
    return this.prisma.workDay.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
      include: {
        orders: {
          where: { orderTransaction: { some: { isPaid: true } } },
          include: { orderDetails: true },
        },
      },
    });
  }

  async findAllWithOrders() {
    return this.prisma.workDay.findMany({
      orderBy: { openedAt: 'desc' },
      include: {
        orders: {
          where: { orderTransaction: { some: { isPaid: true } } },
          include: { orderTransaction: true, orderDetails: true },
        },
      },
    });
  }
}
