import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PointsRepository } from './points.repository';
import { Prisma, PointsEntryType, TransactionType } from '@prisma/client';
import {
  DEFAULT_POINTS_SETTINGS,
  DEFAULT_POINTS_TIERS,
  MAX_POINTS_LEVELS,
} from './points.constants';
import {
  UpdatePointsSettingsDto,
  UpdatePointsTiersDto,
} from './dto/update-points-settings.dto';

/** Configuração já convertida pra number — Decimal não serve pra fazer conta de multiplicador. */
export interface PointsSettingsView {
  enabled: boolean;
  moneyRate: number;
  pixRate: number;
  creditRate: number;
  debitRate: number;
  onTheBillGraceDays: number;
  mlmEnabled: boolean;
  selfMultiplier: number;
  level2Multiplier: number;
  level3Multiplier: number;
  level4Multiplier: number;
  tiersEnabled: boolean;
  activeAffiliateWindowDays: number;
  pointsPerReal: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  expirationDays: number;
  inactivityDays: number;
  maxCashbackPercent: number;
}

export interface PointsTierView {
  level: number;
  name: string;
  multiplier: number;
  minActiveAffiliates: number;
}

interface AwardParams {
  orderId: string;
  orderTransactionId: string;
  clientId: string | null | undefined;
  transactionType: TransactionType | null | undefined;
  /** Valor de PRODUTOS que gera pontos — sem frete, sem juros, já sem o desconto em pontos. */
  productBasis: Prisma.Decimal | number;
  openedAt: Date;
  paidAt: Date;
  /**
   * Notinha: liga a checagem de prazo. Comprar fiado e só pagar depois do
   * prazo não pontua, senão o programa financiaria a inadimplência.
   */
  applyGrace?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ZERO = new Prisma.Decimal(0);

const dec = (value: Prisma.Decimal | number | string) =>
  value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);

/** Pontos guardam 4 casas: 0,95 ponto por real em compras pequenas some se arredondar antes. */
const roundPoints = (value: Prisma.Decimal) => value.toDecimalPlaces(4);

const roundMoney = (value: Prisma.Decimal) =>
  value.toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private readonly repository: PointsRepository) {}

  // ==========================================================
  // Configuração
  // ==========================================================

  async getSettings(tx?: Prisma.TransactionClient): Promise<PointsSettingsView> {
    const row = await this.repository.getSettings(tx);
    if (!row) return { ...DEFAULT_POINTS_SETTINGS };

    return {
      enabled: row.enabled,
      moneyRate: Number(row.moneyRate),
      pixRate: Number(row.pixRate),
      creditRate: Number(row.creditRate),
      debitRate: Number(row.debitRate),
      onTheBillGraceDays: row.onTheBillGraceDays,
      mlmEnabled: row.mlmEnabled,
      selfMultiplier: Number(row.selfMultiplier),
      level2Multiplier: Number(row.level2Multiplier),
      level3Multiplier: Number(row.level3Multiplier),
      level4Multiplier: Number(row.level4Multiplier),
      tiersEnabled: row.tiersEnabled,
      activeAffiliateWindowDays: row.activeAffiliateWindowDays,
      pointsPerReal: row.pointsPerReal,
      minRedeemPoints: row.minRedeemPoints,
      maxRedeemPercent: Number(row.maxRedeemPercent),
      expirationDays: row.expirationDays,
      inactivityDays: row.inactivityDays,
      maxCashbackPercent: Number(row.maxCashbackPercent),
    };
  }

  async getTiers(tx?: Prisma.TransactionClient): Promise<PointsTierView[]> {
    const rows = await this.repository.findTiers(tx);
    if (rows.length === 0) return DEFAULT_POINTS_TIERS.map((tier) => ({ ...tier }));

    return rows.map((row) => ({
      level: row.level,
      name: row.name,
      multiplier: Number(row.multiplier),
      minActiveAffiliates: row.minActiveAffiliates,
    }));
  }

  /**
   * Pior caso da configuração atual, em % da receita de produtos.
   *
   * Assume todo mundo no tier mais alto, na forma de pagamento que mais
   * pontua, com a árvore de indicação cheia nos quatro níveis. É de
   * propósito pessimista: o número que interessa antes de salvar é o teto
   * do que a regra PODE distribuir, não a média de hoje.
   */
  projectDistribution(settings: PointsSettingsView, tiers: PointsTierView[]) {
    const bestRate = Math.max(
      settings.moneyRate,
      settings.pixRate,
      settings.creditRate,
      settings.debitRate,
    );

    const multipliers = tiers.map((tier) => tier.multiplier);
    const bestTier = settings.tiersEnabled && multipliers.length
      ? Math.max(...multipliers)
      : 1;
    const baseTier = settings.tiersEnabled && multipliers.length
      ? Math.min(...multipliers)
      : 1;

    const networkSum = settings.mlmEnabled
      ? settings.level2Multiplier +
        settings.level3Multiplier +
        settings.level4Multiplier
      : 0;
    const chainSum = settings.selfMultiplier + networkSum;

    const toPercent = (pointsPerReal: number) =>
      settings.pointsPerReal > 0
        ? (pointsPerReal / settings.pointsPerReal) * 100
        : 0;

    const worstCase = Number(toPercent(bestRate * bestTier * chainSum).toFixed(4));

    return {
      // Cenário máximo: rede inteira, todo mundo no topo da escada.
      worstCasePercent: worstCase,
      // Piso: rede inteira, mas todo mundo no degrau de entrada.
      baseCasePercent: Number(toPercent(bestRate * baseTier * chainSum).toFixed(4)),
      // Só o comprador, sem rede — o que uma compra avulsa custa.
      soloPercent: Number(
        toPercent(bestRate * bestTier * settings.selfMultiplier).toFixed(4),
      ),
      limitPercent: settings.maxCashbackPercent,
      // Falha fechada: número impossível de calcular (campo faltando,
      // configuração corrompida) conta como estouro. Uma trava de
      // segurança que se cala diante do inesperado não é uma trava.
      exceedsLimit: Number.isFinite(worstCase)
        ? worstCase > settings.maxCashbackPercent
        : true,
    };
  }

  /**
   * Barreira do teto de cashback.
   *
   * Não corta o ganho de ninguém no meio da compra (o cliente veria menos
   * do que a página pública prometeu). Trava o SALVAMENTO: quem quiser uma
   * regra que projeta acima do lucro líquido precisa confirmar que viu o
   * aviso.
   */
  private assertWithinCashbackLimit(
    settings: PointsSettingsView,
    tiers: PointsTierView[],
    acknowledged?: boolean,
  ) {
    const projection = this.projectDistribution(settings, tiers);
    if (!projection.exceedsLimit || acknowledged) return projection;

    throw new BadRequestException({
      message:
        `Essa configuração distribui até ${projection.worstCasePercent.toFixed(2)}% ` +
        `da receita de produtos, acima do teto de ${projection.limitPercent.toFixed(2)}%. ` +
        'Acima do lucro líquido, o programa consome a empresa no longo prazo.',
      code: 'POINTS_CASHBACK_LIMIT',
      projection,
    });
  }

  async updateSettings(dto: UpdatePointsSettingsDto) {
    const { acknowledgeCashbackRisk, ...received } = dto;

    // O ValidationPipe entrega o DTO como instância da classe, com TODOS
    // os campos declarados presentes — os que não vieram no corpo ficam
    // como `undefined`. Espalhar isso por cima da configuração atual
    // apagaria os campos não enviados, e a projeção sairia NaN: a trava do
    // teto passaria batido justamente quando mais importa.
    const changes = Object.fromEntries(
      Object.entries(received).filter(([, value]) => value !== undefined),
    ) as Partial<PointsSettingsView>;

    const current = await this.getSettings();
    const merged: PointsSettingsView = { ...current, ...changes };
    const tiers = await this.getTiers();

    this.assertWithinCashbackLimit(merged, tiers, acknowledgeCashbackRisk);

    await this.repository.upsertSettings(changes as Prisma.PointsSettingsUncheckedUpdateInput);
    return this.getConfig();
  }

  async updateTiers(dto: UpdatePointsTiersDto) {
    const levels = new Set(dto.tiers.map((tier) => tier.level));
    if (levels.size !== dto.tiers.length) {
      throw new BadRequestException('Dois degraus não podem ter o mesmo nível.');
    }

    const settings = await this.getSettings();
    const sorted = [...dto.tiers].sort((a, b) => a.level - b.level);

    // Escada tem que subir: um degrau mais alto exigindo MENOS gente
    // tornaria o degrau de baixo inalcançável — ninguém pararia nele.
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].minActiveAffiliates <= sorted[index - 1].minActiveAffiliates) {
        throw new BadRequestException(
          `O degrau "${sorted[index].name}" precisa exigir mais afiliados que "${sorted[index - 1].name}".`,
        );
      }
    }

    this.assertWithinCashbackLimit(settings, sorted, dto.acknowledgeCashbackRisk);

    await this.repository.replaceTiers(sorted);
    return this.getConfig();
  }

  /** Botão "Restaurar padrão": volta configuração e escada de fábrica. */
  async resetConfig() {
    await this.repository.upsertSettings({ ...DEFAULT_POINTS_SETTINGS });
    await this.repository.replaceTiers(DEFAULT_POINTS_TIERS.map((tier) => ({ ...tier })));
    return this.getConfig();
  }

  async getConfig() {
    const [settings, tiers] = await Promise.all([this.getSettings(), this.getTiers()]);
    return { settings, tiers, projection: this.projectDistribution(settings, tiers) };
  }

  /**
   * O que a página pública de pontos precisa mostrar.
   *
   * Sai da MESMA linha de configuração que o motor usa pra calcular. Se a
   * página explicasse números de um lugar e o motor pagasse por outro, o
   * problema deixaria de ser técnico e viraria jurídico.
   */
  async getPublicRules() {
    const [settings, tiers] = await Promise.all([this.getSettings(), this.getTiers()]);

    return {
      enabled: settings.enabled,
      rates: {
        Money: settings.moneyRate,
        Pix: settings.pixRate,
        CreditCard: settings.creditRate,
        DebitCard: settings.debitRate,
      },
      // onTheBillGraceDays fica FORA daqui: esta resposta é pública, e o
      // nome do campo já entregaria que existe compra fiado — um benefício
      // liberado individualmente, que nem todo cliente pode ver. Quem tem
      // acesso conhece a regra no checkout, onde a opção aparece.
      mlmEnabled: settings.mlmEnabled,
      levels: [
        { level: 1, label: 'Você', multiplier: settings.selfMultiplier },
        { level: 2, label: 'Quem você indicou', multiplier: settings.level2Multiplier },
        { level: 3, label: 'Indicado do seu indicado', multiplier: settings.level3Multiplier },
        { level: 4, label: 'Um nível abaixo disso', multiplier: settings.level4Multiplier },
      ],
      tiersEnabled: settings.tiersEnabled,
      tiers,
      activeAffiliateWindowDays: settings.activeAffiliateWindowDays,
      pointsPerReal: settings.pointsPerReal,
      minRedeemPoints: settings.minRedeemPoints,
      maxRedeemPercent: settings.maxRedeemPercent,
      expirationDays: settings.expirationDays,
      inactivityDays: settings.inactivityDays,
    };
  }

  // ==========================================================
  // Tiers
  // ==========================================================

  /** O degrau mais alto que a quantidade de afiliados ativos alcança. */
  resolveTier(activeAffiliates: number, tiers: PointsTierView[], enabled: boolean) {
    if (!enabled || tiers.length === 0) {
      return { level: 0, name: 'Sem tier', multiplier: 1, minActiveAffiliates: 0 };
    }

    const ordered = [...tiers].sort(
      (a, b) => b.minActiveAffiliates - a.minActiveAffiliates,
    );
    const reached = ordered.find(
      (tier) => activeAffiliates >= tier.minActiveAffiliates,
    );

    // Sem nenhum degrau alcançado, vale o mais baixo da escada.
    return reached ?? ordered[ordered.length - 1];
  }

  private async tierOf(
    userId: string,
    settings: PointsSettingsView,
    tiers: PointsTierView[],
    now: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const since = new Date(now.getTime() - settings.activeAffiliateWindowDays * DAY_MS);
    const active = await this.repository.countActiveDirectAffiliates(userId, since, tx);
    return { active, tier: this.resolveTier(active, tiers, settings.tiersEnabled) };
  }

  // ==========================================================
  // Motor de pontuação
  // ==========================================================

  /** Pontos por R$1 da forma de pagamento. Notinha e boleto não pontuam sozinhos. */
  rateFor(
    transactionType: TransactionType | null | undefined,
    settings: PointsSettingsView,
  ): number {
    switch (transactionType) {
      case TransactionType.Money:
        return settings.moneyRate;
      case TransactionType.Pix:
        return settings.pixRate;
      case TransactionType.CreditCard:
        return settings.creditRate;
      case TransactionType.DebitCard:
        return settings.debitRate;
      default:
        // OnTheBill só pontua quando é quitada — e aí o tipo já foi
        // reescrito pra forma de recebimento de verdade.
        return 0;
    }
  }

  private levelMultiplier(distance: number, settings: PointsSettingsView): number {
    if (distance > 0 && !settings.mlmEnabled) return 0;
    switch (distance) {
      case 0:
        return settings.selfMultiplier;
      case 1:
        return settings.level2Multiplier;
      case 2:
        return settings.level3Multiplier;
      case 3:
        return settings.level4Multiplier;
      default:
        return 0;
    }
  }

  /**
   * Do comprador pra cima, no máximo MAX_POINTS_LEVELS pessoas.
   *
   * O conjunto de visitados existe porque nada no banco impede que alguém
   * acabe indicado por um descendente — e um ciclo aqui viraria looping
   * infinito no meio de uma venda.
   */
  private async buildUpline(
    buyerId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    const chain: string[] = [];
    const seen = new Set<string>();
    let currentId: string | null = buyerId;

    while (currentId && chain.length < MAX_POINTS_LEVELS && !seen.has(currentId)) {
      seen.add(currentId);
      chain.push(currentId);

      const user = await this.repository.findUserForPoints(currentId, tx);
      currentId = user?.referredById ?? null;
    }

    return chain;
  }

  /**
   * Credita os pontos de um recebimento REAL.
   *
   * Chamada nos três — e só nos três — momentos em que o dinheiro entra:
   * venda de balcão paga na hora, notinha quitada e entrega concluída.
   * Promessa de pagamento não pontua.
   */
  async awardForPayment(tx: Prisma.TransactionClient, params: AwardParams) {
    const settings = await this.getSettings(tx);
    if (!settings.enabled) return null;

    // Só quem tem conta pontua: sem cadastro não há onde guardar o saldo
    // nem como saber quem indicou quem.
    if (!params.clientId) return null;

    const basis = dec(params.productBasis);
    if (basis.lessThanOrEqualTo(0)) return null;

    const rate = this.rateFor(params.transactionType, settings);
    if (rate <= 0) return null;

    if (params.applyGrace) {
      const elapsedDays =
        (params.paidAt.getTime() - params.openedAt.getTime()) / DAY_MS;
      if (elapsedDays > settings.onTheBillGraceDays) {
        this.logger.log(
          `Notinha ${params.orderId} quitada fora do prazo de ${settings.onTheBillGraceDays} dias: sem pontos.`,
        );
        return { awarded: 0, reason: 'grace-expired' as const };
      }
    }

    // Reprocessar o mesmo recebimento (fechar a notinha de novo, refazer
    // uma entrega) não pode pagar duas vezes.
    const existing = await this.repository.findEntriesByTransaction(
      params.orderTransactionId,
      tx,
    );
    if (existing.length > 0) return { awarded: 0, reason: 'already-awarded' as const };

    const tiers = await this.getTiers(tx);
    const now = params.paidAt;

    // A própria compra já conta pra atividade: quem acabou de comprar está
    // ativo, e isso pode promover o padrinho AGORA. Por isso vem antes de
    // calcular os tiers da linha ascendente.
    await this.repository.markPurchase(params.clientId, now, tx);

    const basePoints = basis.mul(rate);
    const expiresAt = new Date(now.getTime() + settings.expirationDays * DAY_MS);
    const chain = await this.buildUpline(params.clientId, tx);

    const credited: { userId: string; level: number; amount: Prisma.Decimal }[] = [];

    for (const [distance, userId] of chain.entries()) {
      const levelMultiplier = this.levelMultiplier(distance, settings);
      if (levelMultiplier <= 0) continue;

      // O tier é o de QUEM RECEBE: chamar mais gente acelera o próprio
      // ganho, inclusive sobre o consumo da rede abaixo.
      const { tier } = await this.tierOf(userId, settings, tiers, now, tx);

      const amount = roundPoints(basePoints.mul(levelMultiplier).mul(tier.multiplier));
      if (amount.lessThanOrEqualTo(0)) continue;

      await this.repository.createEntry(
        {
          userId,
          type: PointsEntryType.Earn,
          amount,
          remaining: amount,
          expiresAt,
          sourceLevel: distance + 1,
          sourceUserId: params.clientId,
          orderId: params.orderId,
          orderTransactionId: params.orderTransactionId,
          basisAmount: basis,
          paymentRate: new Prisma.Decimal(rate),
          levelMultiplier: new Prisma.Decimal(levelMultiplier),
          tierMultiplier: new Prisma.Decimal(tier.multiplier),
          tierLevel: tier.level,
          description:
            distance === 0
              ? 'Sua compra'
              : `Compra de um usuário de nível ${distance + 1} da sua rede`,
        },
        tx,
      );

      await this.repository.syncBalance(userId, now, tx);
      credited.push({ userId, level: distance + 1, amount });
    }

    const buyerAmount =
      credited.find((entry) => entry.userId === params.clientId)?.amount ?? ZERO;

    await tx.orderTransaction.update({
      where: { id: params.orderTransactionId },
      data: { pointsAwarded: buyerAmount },
    });

    return { awarded: Number(buyerAmount), credited, reason: 'ok' as const };
  }

  /**
   * Desfaz a pontuação de um recebimento que deixou de existir (pedido
   * cancelado, entrega revertida).
   *
   * Tira dos lotes mais NOVOS primeiro: os antigos são os que estão perto
   * de vencer, e consumi-los aqui encurtaria a validade de pontos que o
   * cliente ganhou legitimamente em outra compra.
   */
  async revertForTransaction(tx: Prisma.TransactionClient, orderTransactionId: string) {
    const entries = await this.repository.findEntriesByTransaction(orderTransactionId, tx);
    if (entries.length === 0) return { reverted: 0 };

    // Estornar duas vezes o mesmo recebimento tiraria pontos que o cliente
    // ganhou em outra compra — o cancelamento pode ser reprocessado, o
    // débito não pode.
    const alreadyReverted = await this.repository.countReversals(
      orderTransactionId,
      tx,
    );
    if (alreadyReverted > 0) return { reverted: 0 };

    const now = new Date();
    let reverted = 0;

    for (const entry of entries) {
      let toRemove = dec(entry.amount);

      // O próprio lote primeiro: é literalmente o ganho que está sendo
      // desfeito.
      const ownRemaining = dec(entry.remaining);
      const fromOwn = Prisma.Decimal.min(ownRemaining, toRemove);
      if (fromOwn.greaterThan(0)) {
        await this.repository.updateLotRemaining(
          entry.id,
          ownRemaining.sub(fromOwn),
          tx,
        );
        toRemove = toRemove.sub(fromOwn);
      }

      // O que já tinha sido gasto sai dos lotes mais novos. Não dá pra
      // deixar saldo negativo: se a pessoa já usou tudo, o estorno para
      // onde o saldo acabar.
      if (toRemove.greaterThan(0)) {
        const lots = await this.repository.findLiveLotsNewestFirst(entry.userId, tx);
        for (const lot of lots) {
          if (toRemove.lessThanOrEqualTo(0)) break;
          if (lot.id === entry.id) continue;

          const available = dec(lot.remaining);
          const taken = Prisma.Decimal.min(available, toRemove);
          await this.repository.updateLotRemaining(lot.id, available.sub(taken), tx);
          toRemove = toRemove.sub(taken);
        }
      }

      const removed = dec(entry.amount).sub(toRemove);
      if (removed.greaterThan(0)) {
        await this.repository.createEntry(
          {
            userId: entry.userId,
            type: PointsEntryType.Reversal,
            amount: removed.negated(),
            remaining: ZERO,
            orderId: entry.orderId,
            orderTransactionId,
            sourceLevel: entry.sourceLevel,
            description: 'Estorno: o pagamento que gerou esses pontos foi desfeito',
          },
          tx,
        );
        reverted += 1;
      }

      await this.repository.syncBalance(entry.userId, now, tx);
    }

    await tx.orderTransaction.update({
      where: { id: orderTransactionId },
      data: { pointsAwarded: 0 },
    });

    return { reverted };
  }

  // ==========================================================
  // Resgate
  // ==========================================================

  /**
   * Quantos pontos cabem nesta compra.
   *
   * Três limites ao mesmo tempo: o saldo, o mínimo pra destravar o resgate
   * e o teto percentual sobre os PRODUTOS. O teto é o que garante entrada
   * de dinheiro novo — sem ele daria pra levar sacola inteira de graça.
   */
  redeemCeiling(
    balance: Prisma.Decimal | number,
    productTotal: Prisma.Decimal | number,
    settings: PointsSettingsView,
  ) {
    const maxDiscount = dec(productTotal).mul(settings.maxRedeemPercent).div(100);
    const pointsForMaxDiscount = maxDiscount.mul(settings.pointsPerReal);
    const ceiling = Prisma.Decimal.min(dec(balance), pointsForMaxDiscount);

    return ceiling.greaterThan(0)
      ? ceiling.toDecimalPlaces(0, Prisma.Decimal.ROUND_DOWN)
      : ZERO;
  }

  pointsToMoney(points: Prisma.Decimal | number, settings: PointsSettingsView) {
    return roundMoney(dec(points).div(settings.pointsPerReal));
  }

  /** Valida o resgate pedido no checkout e devolve quanto ele vale em reais. */
  async validateRedemption(
    userId: string | null | undefined,
    requestedPoints: number,
    productTotal: Prisma.Decimal | number,
    tx?: Prisma.TransactionClient,
  ) {
    const points = dec(requestedPoints ?? 0);
    if (points.lessThanOrEqualTo(0)) {
      return { points: ZERO, discount: ZERO };
    }

    const settings = await this.getSettings(tx);
    if (!settings.enabled) {
      throw new BadRequestException('O programa de pontos está desativado.');
    }
    if (!userId) {
      throw new ForbiddenException('Só clientes cadastrados podem usar pontos.');
    }

    if (points.lessThan(settings.minRedeemPoints)) {
      throw new BadRequestException(
        `A quantidade mínima permitida é ${settings.minRedeemPoints} pontos.`,
      );
    }

    const user = await this.repository.findUserForPoints(userId, tx);
    if (!user) throw new NotFoundException('Cliente não encontrado.');

    const balance = dec(user.pointsBalance);
    if (points.greaterThan(balance)) {
      throw new BadRequestException(
        `Você tem ${balance.toDecimalPlaces(0, Prisma.Decimal.ROUND_DOWN)} pontos disponíveis.`,
      );
    }

    const ceiling = this.redeemCeiling(balance, productTotal, settings);
    if (points.greaterThan(ceiling)) {
      throw new BadRequestException(
        `Os pontos podem abater no máximo ${settings.maxRedeemPercent}% do valor dos produtos ` +
          `(até ${ceiling} pontos nesta compra). O frete não pode ser abatido.`,
      );
    }

    return { points, discount: this.pointsToMoney(points, settings) };
  }

  /** Baixa os pontos do saldo, consumindo os lotes mais antigos primeiro. */
  async consumeForOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    points: Prisma.Decimal,
    orderId: string,
    orderTransactionId: string,
  ) {
    if (points.lessThanOrEqualTo(0)) return ZERO;

    const now = new Date();
    const lots = await this.repository.findLiveLots(userId, now, tx);

    let pending = points;
    for (const lot of lots) {
      if (pending.lessThanOrEqualTo(0)) break;
      const available = dec(lot.remaining);
      const taken = Prisma.Decimal.min(available, pending);
      await this.repository.updateLotRemaining(lot.id, available.sub(taken), tx);
      pending = pending.sub(taken);
    }

    if (pending.greaterThan(0)) {
      // Só chega aqui se o saldo mudou entre a validação e a gravação.
      // Derrubar a transação é o certo: o pedido inteiro volta atrás.
      throw new BadRequestException(
        'Seu saldo de pontos mudou durante a compra. Refaça o pedido.',
      );
    }

    await this.repository.createEntry(
      {
        userId,
        type: PointsEntryType.Redeem,
        amount: points.negated(),
        remaining: ZERO,
        orderId,
        orderTransactionId,
        description: 'Desconto usado no pedido',
      },
      tx,
    );

    await this.repository.syncBalance(userId, now, tx);
    return points;
  }

  /**
   * Devolve os pontos usados num pedido que foi desfeito.
   *
   * Volta como lote novo, com validade contada de agora. Recriar a
   * validade original daria um lote que já nasce vencido em compras
   * antigas — pior pro cliente do que a pequena generosidade daqui.
   */
  async refundRedemption(
    tx: Prisma.TransactionClient,
    orderId: string,
    userId: string,
    points: Prisma.Decimal | number,
  ) {
    const amount = dec(points);
    if (amount.lessThanOrEqualTo(0)) return;

    const settings = await this.getSettings(tx);
    const now = new Date();

    await this.repository.createEntry(
      {
        userId,
        type: PointsEntryType.Earn,
        amount,
        remaining: amount,
        expiresAt: new Date(now.getTime() + settings.expirationDays * DAY_MS),
        // Vai preso ao PEDIDO, não à transação: a transação já pode ter um
        // lote de ganho, e a trava anti-duplicidade recusaria um segundo.
        orderId,
        description: 'Devolução dos pontos de um pedido cancelado',
      },
      tx,
    );

    await this.repository.syncBalance(userId, now, tx);
  }

  // ==========================================================
  // Simulação para o checkout
  // ==========================================================

  /**
   * Quanto esta compra vai render, antes de fechar.
   *
   * O checkout precisa disso pra dizer o número em destaque — e esse
   * número tem que sair do mesmo cálculo que o motor usa depois, senão a
   * tela promete uma coisa e o extrato mostra outra.
   */
  async quote(
    userId: string | null | undefined,
    productTotal: number,
    transactionType: TransactionType | null | undefined,
    pointsToRedeem = 0,
  ) {
    const [settings, tiers] = await Promise.all([this.getSettings(), this.getTiers()]);

    const empty = {
      enabled: settings.enabled,
      pointsPerReal: settings.pointsPerReal,
      minRedeemPoints: settings.minRedeemPoints,
      maxRedeemPercent: settings.maxRedeemPercent,
      balance: 0,
      maxRedeemablePoints: 0,
      redeemPoints: 0,
      redeemDiscount: 0,
      basis: 0,
      rate: 0,
      pointsToEarn: 0,
      tier: null as null | (PointsTierView & { activeAffiliates: number }),
      network: [] as { level: number; multiplier: number }[],
      expirationDays: settings.expirationDays,
    };

    if (!settings.enabled || !userId) return empty;

    const user = await this.repository.findUserForPoints(userId);
    if (!user) return empty;

    const now = new Date();
    const balance = dec(user.pointsBalance);
    const total = dec(productTotal);

    const maxRedeemable = this.redeemCeiling(balance, total, settings);
    // O pedido do cliente é respeitado até o teto; passar disso é erro de
    // tela, e a validação real ainda vai barrar na hora de fechar.
    const redeem = Prisma.Decimal.min(dec(pointsToRedeem ?? 0), maxRedeemable);
    const redeemPoints = redeem.greaterThanOrEqualTo(settings.minRedeemPoints)
      ? redeem
      : ZERO;
    const redeemDiscount = this.pointsToMoney(redeemPoints, settings);

    // Pontos nascem do que efetivamente entra em dinheiro: o que foi pago
    // com pontos não gera pontos de novo.
    const basis = Prisma.Decimal.max(total.sub(redeemDiscount), ZERO);
    const rate = this.rateFor(transactionType, settings);

    const { active, tier } = await this.tierOf(userId, settings, tiers, now);
    const pointsToEarn = roundPoints(
      basis.mul(rate).mul(settings.selfMultiplier).mul(tier.multiplier),
    );

    return {
      ...empty,
      balance: Number(balance),
      maxRedeemablePoints: Number(maxRedeemable),
      redeemPoints: Number(redeemPoints),
      redeemDiscount: Number(redeemDiscount),
      basis: Number(basis),
      rate,
      pointsToEarn: Number(pointsToEarn),
      tier: { ...tier, activeAffiliates: active },
      network: [
        { level: 2, multiplier: settings.level2Multiplier },
        { level: 3, multiplier: settings.level3Multiplier },
        { level: 4, multiplier: settings.level4Multiplier },
      ],
    };
  }

  // ==========================================================
  // Indicação
  // ==========================================================

  private randomCode(length = 8) {
    let code = '';
    for (let index = 0; index < length; index += 1) {
      code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
    }
    return code;
  }

  /**
   * Código do link de indicação, criado na primeira vez que é pedido.
   *
   * Não nasce no cadastro de propósito: quem nunca divulgou nada não
   * precisa carregar um código, e gerar sob demanda evita encher a tabela
   * de códigos que ninguém usou.
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.repository.findUserForPoints(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.referralCode) return user.referralCode;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.randomCode();
      const taken = await this.repository.findByReferralCode(code);
      if (taken) continue;
      try {
        const updated = await this.repository.setReferralCode(userId, code);
        return updated.referralCode as string;
      } catch {
        // Corrida com outro cadastro pedindo código no mesmo instante:
        // tenta de novo com outro sorteio.
      }
    }

    throw new BadRequestException('Não foi possível gerar seu código agora. Tente de novo.');
  }

  /** Traduz o `?ref=` do cadastro no id do padrinho. Código inválido é ignorado. */
  async resolveReferralCode(code?: string | null): Promise<string | null> {
    if (!code) return null;
    const sponsor = await this.repository.findByReferralCode(code.trim().toUpperCase());
    return sponsor?.id ?? null;
  }

  /** Quem indicou, pra tela de cadastro poder dizer "convidado por Fulano". */
  async describeReferralCode(code?: string | null) {
    if (!code) return null;
    const sponsor = await this.repository.findByReferralCode(code.trim().toUpperCase());
    if (!sponsor) return null;
    // Só o primeiro nome: quem se cadastra não precisa saber o nome
    // completo de quem compartilhou o link.
    return { firstName: sponsor.fullName.trim().split(/\s+/)[0] };
  }

  // ==========================================================
  // Visão do cliente
  // ==========================================================

  async getMySummary(userId: string) {
    const [settings, tiers, user] = await Promise.all([
      this.getSettings(),
      this.getTiers(),
      this.repository.findUserForPoints(userId),
    ]);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const now = new Date();
    const { active, tier } = await this.tierOf(userId, settings, tiers, now);
    const totalAffiliates = await this.repository.countDirectAffiliates(userId);

    const ordered = [...tiers].sort((a, b) => a.minActiveAffiliates - b.minActiveAffiliates);
    const nextTier = ordered.find((step) => step.minActiveAffiliates > active) ?? null;

    const balance = dec(user.pointsBalance);

    return {
      enabled: settings.enabled,
      // O header mostra pontos inteiros: "1.204,7318 pontos" não ajuda
      // ninguém a decidir nada.
      balance: Number(balance.toDecimalPlaces(0, Prisma.Decimal.ROUND_DOWN)),
      balanceExact: Number(balance),
      balanceInReais: Number(this.pointsToMoney(balance, settings)),
      pointsPerReal: settings.pointsPerReal,
      minRedeemPoints: settings.minRedeemPoints,
      maxRedeemPercent: settings.maxRedeemPercent,
      expirationDays: settings.expirationDays,
      inactivityDays: settings.inactivityDays,
      activeAffiliateWindowDays: settings.activeAffiliateWindowDays,
      lastPurchaseAt: user.lastPurchaseAt,
      tier: settings.tiersEnabled ? { ...tier, activeAffiliates: active } : null,
      nextTier: settings.tiersEnabled && nextTier
        ? { ...nextTier, missing: nextTier.minActiveAffiliates - active }
        : null,
      affiliates: { active, total: totalAffiliates },
      referralCode: user.referralCode,
    };
  }

  async getMyStatement(userId: string, limit = 50) {
    const entries = await this.repository.findStatement(userId, Math.min(limit, 200));
    return entries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: Number(entry.amount),
      remaining: Number(entry.remaining),
      expiresAt: entry.expiresAt,
      sourceLevel: entry.sourceLevel,
      basisAmount: entry.basisAmount ? Number(entry.basisAmount) : null,
      tierLevel: entry.tierLevel,
      tierMultiplier: entry.tierMultiplier ? Number(entry.tierMultiplier) : null,
      levelMultiplier: entry.levelMultiplier ? Number(entry.levelMultiplier) : null,
      description: entry.description,
      createdAt: entry.createdAt,
    }));
  }

  // ==========================================================
  // Manutenção (cron)
  // ==========================================================

  /** Vence os lotes que passaram da validade. */
  async expireLots(batchSize = 500) {
    const now = new Date();
    const lots = await this.repository.findExpiredLots(now, batchSize);
    if (lots.length === 0) return { expired: 0, points: 0 };

    const byUser = new Map<string, Prisma.Decimal>();
    for (const lot of lots) {
      byUser.set(
        lot.userId,
        (byUser.get(lot.userId) ?? ZERO).add(dec(lot.remaining)),
      );
    }

    await this.repository.runInTransaction(async (tx) => {
      for (const lot of lots) {
        await this.repository.updateLotRemaining(lot.id, ZERO, tx);
      }
      for (const [userId, total] of byUser) {
        await this.repository.createEntry(
          {
            userId,
            type: PointsEntryType.Expire,
            amount: total.negated(),
            remaining: ZERO,
            description: 'Pontos vencidos pelo prazo de validade',
          },
          tx,
        );
        await this.repository.syncBalance(userId, now, tx);
      }
    });

    const points = Array.from(byUser.values()).reduce(
      (sum, value) => sum.add(value),
      ZERO,
    );
    return { expired: lots.length, points: Number(points) };
  }

  /** Zera o saldo de quem parou de comprar. */
  async resetInactive(batchSize = 500) {
    const settings = await this.getSettings();
    if (!settings.enabled) return { users: 0, points: 0 };

    const now = new Date();
    const cutoff = new Date(now.getTime() - settings.inactivityDays * DAY_MS);
    const users = await this.repository.findInactiveWithBalance(cutoff, batchSize);
    if (users.length === 0) return { users: 0, points: 0 };

    let total = ZERO;

    await this.repository.runInTransaction(async (tx) => {
      for (const user of users) {
        const lots = await this.repository.findLiveLots(user.id, now, tx);
        let removed = ZERO;
        for (const lot of lots) {
          removed = removed.add(dec(lot.remaining));
          await this.repository.updateLotRemaining(lot.id, ZERO, tx);
        }
        if (removed.lessThanOrEqualTo(0)) continue;

        await this.repository.createEntry(
          {
            userId: user.id,
            type: PointsEntryType.InactivityReset,
            amount: removed.negated(),
            remaining: ZERO,
            description: `Sem compras por ${settings.inactivityDays} dias`,
          },
          tx,
        );
        await this.repository.syncBalance(user.id, now, tx);
        total = total.add(removed);
      }
    });

    return { users: users.length, points: Number(total) };
  }

  // ==========================================================
  // Resumo de saúde (Admin)
  // ==========================================================

  /**
   * Os números que respondem "estou quebrando no longo prazo?".
   *
   * O que importa é a distribuição REAL do período contra o teto: a
   * projeção de pior caso diz o que a regra permite, esta conta diz o que
   * ela está de fato custando.
   */
  async getHealthSummary(days = 30) {
    const [settings, tiers] = await Promise.all([this.getSettings(), this.getTiers()]);
    const now = new Date();
    const from = new Date(now.getTime() - days * DAY_MS);

    const [
      revenue,
      byType,
      issuedRaw,
      byLevel,
      outstanding,
      expiringSoon,
      holders,
      referred,
      sponsors,
    ] =
      await Promise.all([
        this.repository.sumProductRevenue(from, now),
        this.repository.sumEntriesByType(from, now),
        this.repository.sumIssuedEarn(from, now),
        this.repository.sumEarnByLevel(from, now),
        this.repository.sumOutstanding(now),
        this.repository.sumExpiringUntil(now, new Date(now.getTime() + 30 * DAY_MS)),
        this.repository.countUsersWithBalance(),
        this.repository.countReferredUsers(),
        this.repository.groupActiveAffiliateCounts(
          new Date(now.getTime() - settings.activeAffiliateWindowDays * DAY_MS),
        ),
      ]);

    const sumOf = (type: PointsEntryType) =>
      dec(byType.find((row) => row.type === type)?._sum.amount ?? 0);

    // Só emissão nova: devolução de resgate cancelado é lote de ganho, mas
    // não é cashback novo saindo da empresa.
    const issued = dec(issuedRaw);
    const redeemed = sumOf(PointsEntryType.Redeem).abs();
    const expired = sumOf(PointsEntryType.Expire).abs();
    const inactivity = sumOf(PointsEntryType.InactivityReset).abs();
    const reversed = sumOf(PointsEntryType.Reversal).abs();

    // Receita líquida de produtos: o desconto em pontos já não entrou no
    // caixa, então não pode inflar a base da conta de distribuição.
    const netRevenue = dec(revenue.gross).sub(dec(revenue.pointsDiscount));
    const issuedValue = issued.sub(reversed).div(settings.pointsPerReal);
    const redeemedValue = redeemed.div(settings.pointsPerReal);

    const percentOf = (value: Prisma.Decimal) =>
      netRevenue.greaterThan(0)
        ? Number(value.div(netRevenue).mul(100).toDecimalPlaces(4))
        : 0;

    const distributionPercent = percentOf(issuedValue);
    const projection = this.projectDistribution(settings, tiers);

    // Distribuição de padrinhos pela escada: mostra se a rede está
    // realmente subindo de tier ou se todo mundo parou no degrau de baixo.
    const tierHistogram = tiers.map((tier) => ({
      level: tier.level,
      name: tier.name,
      multiplier: tier.multiplier,
      minActiveAffiliates: tier.minActiveAffiliates,
      sponsors: 0,
    }));
    for (const sponsor of sponsors) {
      const reached = this.resolveTier(sponsor.active, tiers, settings.tiersEnabled);
      const bucket = tierHistogram.find((row) => row.level === reached.level);
      if (bucket) bucket.sponsors += 1;
    }

    return {
      periodDays: days,
      from,
      to: now,
      limitPercent: settings.maxCashbackPercent,
      pointsPerReal: settings.pointsPerReal,

      productRevenue: Number(netRevenue.toDecimalPlaces(2)),
      grossProductRevenue: Number(dec(revenue.gross).toDecimalPlaces(2)),

      pointsIssued: Number(issued.toDecimalPlaces(2)),
      pointsIssuedValue: Number(issuedValue.toDecimalPlaces(2)),
      distributionPercent,
      // O que já saiu do caixa de verdade: ponto emitido só vira custo
      // quando é usado.
      pointsRedeemed: Number(redeemed.toDecimalPlaces(2)),
      pointsRedeemedValue: Number(redeemedValue.toDecimalPlaces(2)),
      redeemedPercent: percentOf(redeemedValue),

      pointsExpired: Number(expired.toDecimalPlaces(2)),
      pointsLostToInactivity: Number(inactivity.toDecimalPlaces(2)),
      pointsReversed: Number(reversed.toDecimalPlaces(2)),

      // Passivo: tudo que está em circulação e pode virar desconto amanhã.
      outstandingPoints: Number(dec(outstanding).toDecimalPlaces(2)),
      outstandingValue: Number(
        dec(outstanding).div(settings.pointsPerReal).toDecimalPlaces(2),
      ),
      expiringIn30DaysPoints: Number(dec(expiringSoon).toDecimalPlaces(2)),

      holders,
      referredUsers: referred,
      sponsorsWithActiveNetwork: sponsors.length,
      tierHistogram,

      byLevel: byLevel
        .map((row) => ({
          level: row.sourceLevel ?? 0,
          points: Number(dec(row._sum.amount ?? 0).toDecimalPlaces(2)),
          entries: row._count._all,
        }))
        .sort((a, b) => a.level - b.level),

      projection,
      overLimit: distributionPercent > settings.maxCashbackPercent,
    };
  }
}
