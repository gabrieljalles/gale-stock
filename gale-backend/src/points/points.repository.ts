import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PointsEntryType } from '@prisma/client';

const SETTINGS_ID = 1;

@Injectable()
export class PointsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  // ---------- Configuração ----------

  async getSettings(tx?: Prisma.TransactionClient) {
    return this.db(tx).pointsSettings.findUnique({ where: { id: SETTINGS_ID } });
  }

  async upsertSettings(data: Prisma.PointsSettingsUncheckedUpdateInput) {
    return this.prisma.pointsSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ...(data as Prisma.PointsSettingsUncheckedCreateInput),
      },
      update: data,
    });
  }

  async findTiers(tx?: Prisma.TransactionClient) {
    return this.db(tx).pointsTier.findMany({ orderBy: { level: 'asc' } });
  }

  /**
   * Grava a escada inteira de uma vez, em transação. Meia escada salva
   * (três degraus novos, quatro velhos) promoveria ou rebaixaria gente por
   * uma combinação que ninguém configurou.
   */
  async replaceTiers(
    tiers: {
      level: number;
      name: string;
      multiplier: number;
      minActiveAffiliates: number;
    }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.pointsTier.deleteMany({
        where: { level: { notIn: tiers.map((tier) => tier.level) } },
      });
      for (const tier of tiers) {
        await tx.pointsTier.upsert({
          where: { level: tier.level },
          create: tier,
          update: tier,
        });
      }
      return tx.pointsTier.findMany({ orderBy: { level: 'asc' } });
    });
  }

  // ---------- Rede de indicação ----------

  async findUserForPoints(userId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        referredById: true,
        pointsBalance: true,
        lastPurchaseAt: true,
        createdAt: true,
      },
    });
  }

  async findByReferralCode(code: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).user.findUnique({
      where: { referralCode: code },
      select: { id: true, fullName: true },
    });
  }

  async setReferralCode(userId: string, referralCode: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { referralCode },
      select: { id: true, referralCode: true },
    });
  }

  /**
   * Indicados DIRETOS que compraram dentro da janela de atividade.
   *
   * É a única contagem que define tier: rede indireta não acelera nada e
   * afiliado parado não conta. Quem sai da janela derruba o tier do
   * padrinho, mas nunca os pontos que já gerou.
   */
  async countActiveDirectAffiliates(
    userId: string,
    since: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).user.count({
      where: { referredById: userId, lastPurchaseAt: { gte: since } },
    });
  }

  async countDirectAffiliates(userId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).user.count({ where: { referredById: userId } });
  }

  // ---------- Extrato / lotes ----------

  async createEntry(
    data: Prisma.PointsEntryUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).pointsEntry.create({ data });
  }

  /** Lotes vivos, do mais antigo pro mais novo — a ordem do consumo FIFO. */
  async findLiveLots(userId: string, now: Date, tx?: Prisma.TransactionClient) {
    return this.db(tx).pointsEntry.findMany({
      where: {
        userId,
        type: PointsEntryType.Earn,
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Lotes do mais novo pro mais antigo — a ordem do estorno. */
  async findLiveLotsNewestFirst(userId: string, tx?: Prisma.TransactionClient) {
    return this.db(tx).pointsEntry.findMany({
      where: { userId, type: PointsEntryType.Earn, remaining: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLotRemaining(
    entryId: string,
    remaining: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).pointsEntry.update({
      where: { id: entryId },
      data: { remaining },
    });
  }

  /**
   * Recalcula o saldo desnormalizado a partir dos lotes vivos.
   *
   * Sempre chamado dentro da mesma transação que mexeu nos lotes: o campo
   * em User é cache de leitura, e cache que pode divergir da fonte não
   * serve pra mostrar saldo de cliente.
   */
  async syncBalance(userId: string, now: Date, tx?: Prisma.TransactionClient) {
    const aggregate = await this.db(tx).pointsEntry.aggregate({
      where: {
        userId,
        type: PointsEntryType.Earn,
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { remaining: true },
    });

    const balance = aggregate._sum.remaining ?? new Prisma.Decimal(0);
    await this.db(tx).user.update({
      where: { id: userId },
      data: { pointsBalance: balance },
    });
    return balance;
  }

  async findStatement(userId: string, take: number) {
    return this.prisma.pointsEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      // sourceUserId fica DE FORA de propósito: o cliente vê o nível que
      // gerou o ponto, nunca quem comprou.
      select: {
        id: true,
        type: true,
        amount: true,
        remaining: true,
        expiresAt: true,
        sourceLevel: true,
        basisAmount: true,
        tierLevel: true,
        tierMultiplier: true,
        levelMultiplier: true,
        description: true,
        createdAt: true,
      },
    });
  }

  async findEntriesByTransaction(
    orderTransactionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).pointsEntry.findMany({
      where: { orderTransactionId, type: PointsEntryType.Earn },
    });
  }

  async countReversals(
    orderTransactionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.db(tx).pointsEntry.count({
      where: { orderTransactionId, type: PointsEntryType.Reversal },
    });
  }

  async markPurchase(userId: string, at: Date, tx?: Prisma.TransactionClient) {
    return this.db(tx).user.update({
      where: { id: userId },
      data: { lastPurchaseAt: at },
    });
  }

  // ---------- Manutenção ----------

  /** Lotes vencidos que ainda têm saldo. */
  async findExpiredLots(now: Date, take: number) {
    return this.prisma.pointsEntry.findMany({
      where: {
        type: PointsEntryType.Earn,
        remaining: { gt: 0 },
        expiresAt: { lte: now },
      },
      orderBy: { expiresAt: 'asc' },
      take,
      select: { id: true, userId: true, remaining: true },
    });
  }

  /**
   * Quem tem saldo mas parou de comprar. Sem compra registrada o relógio
   * conta do cadastro — senão quem nunca comprou ficaria imune pra sempre.
   */
  async findInactiveWithBalance(cutoff: Date, take: number) {
    return this.prisma.user.findMany({
      where: {
        pointsBalance: { gt: 0 },
        OR: [
          { lastPurchaseAt: { lt: cutoff } },
          { lastPurchaseAt: null, createdAt: { lt: cutoff } },
        ],
      },
      take,
      select: { id: true, pointsBalance: true },
    });
  }

  // ---------- Resumo de saúde (Admin) ----------

  /** Receita de produtos recebida na janela, e quanto dela virou desconto. */
  async sumProductRevenue(from: Date, to: Date) {
    const aggregate = await this.prisma.orderTransaction.aggregate({
      where: { isPaid: true, paidDate: { gte: from, lte: to } },
      _sum: { totalProductPrice: true, pointsDiscountAmount: true },
    });
    return {
      gross: aggregate._sum.totalProductPrice ?? new Prisma.Decimal(0),
      pointsDiscount:
        aggregate._sum.pointsDiscountAmount ?? new Prisma.Decimal(0),
    };
  }

  /**
   * Pontos NOVOS emitidos na janela.
   *
   * `sourceLevel` não nulo é o que separa cashback de verdade da devolução
   * de um resgate cancelado: a devolução também é um lote de ganho, mas
   * contá-la como emissão inflaria a distribuição medida com pontos que já
   * tinham sido emitidos antes.
   */
  async sumIssuedEarn(from: Date, to: Date) {
    const aggregate = await this.prisma.pointsEntry.aggregate({
      where: {
        type: PointsEntryType.Earn,
        sourceLevel: { not: null },
        createdAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });
    return aggregate._sum.amount ?? new Prisma.Decimal(0);
  }

  async sumEntriesByType(from: Date, to: Date) {
    return this.prisma.pointsEntry.groupBy({
      by: ['type'],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  async sumEarnByLevel(from: Date, to: Date) {
    return this.prisma.pointsEntry.groupBy({
      by: ['sourceLevel'],
      where: {
        type: PointsEntryType.Earn,
        sourceLevel: { not: null },
        createdAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  /** Passivo total: tudo que está em circulação e pode virar desconto amanhã. */
  async sumOutstanding(now: Date) {
    const aggregate = await this.prisma.pointsEntry.aggregate({
      where: {
        type: PointsEntryType.Earn,
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { remaining: true },
    });
    return aggregate._sum.remaining ?? new Prisma.Decimal(0);
  }

  /** Pontos que vencem dentro da janela — passivo que se resolve sozinho. */
  async sumExpiringUntil(now: Date, until: Date) {
    const aggregate = await this.prisma.pointsEntry.aggregate({
      where: {
        type: PointsEntryType.Earn,
        remaining: { gt: 0 },
        expiresAt: { gt: now, lte: until },
      },
      _sum: { remaining: true },
    });
    return aggregate._sum.remaining ?? new Prisma.Decimal(0);
  }

  async countUsersWithBalance() {
    return this.prisma.user.count({ where: { pointsBalance: { gt: 0 } } });
  }

  async countReferredUsers() {
    return this.prisma.user.count({ where: { referredById: { not: null } } });
  }

  /**
   * Quantos indicados ativos cada padrinho tem, numa consulta só.
   *
   * Agrupado porque a alternativa — contar a rede de cada usuário em
   * looping — fica inviável assim que a base cresce.
   */
  async groupActiveAffiliateCounts(
    since: Date,
  ): Promise<{ sponsorId: string; active: number }[]> {
    const rows = await this.prisma.user.groupBy({
      by: ['referredById'],
      where: { referredById: { not: null }, lastPurchaseAt: { gte: since } },
      _count: { _all: true },
    });
    return rows.map((row) => ({
      sponsorId: row.referredById as string,
      active: row._count._all,
    }));
  }
}
