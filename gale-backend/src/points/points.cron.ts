import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PointsService } from './points.service';

/**
 * As duas perdas passivas de pontos.
 *
 * Rodam de madrugada, quando a loja está parada: as duas varrem lotes e
 * reescrevem saldo, e fazer isso no meio do movimento seguraria transações
 * de venda. Uma vez por dia basta — validade e inatividade são contadas em
 * dias, ninguém percebe algumas horas de atraso.
 */
@Injectable()
export class PointsCron {
  private readonly logger = new Logger(PointsCron.name);

  constructor(private readonly pointsService: PointsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleExpiration() {
    // Em lotes: uma virada de ano-calendário pode vencer muita coisa de
    // uma vez, e uma transação gigante travaria o banco.
    let total = 0;
    for (let round = 0; round < 20; round += 1) {
      const result = await this.pointsService.expireLots();
      total += result.expired;
      if (result.expired === 0) break;
    }
    if (total > 0) this.logger.log(`${total} lotes de pontos vencidos.`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleInactivity() {
    const result = await this.pointsService.resetInactive();
    if (result.users > 0) {
      this.logger.log(
        `${result.users} clientes zerados por inatividade (${result.points} pontos).`,
      );
    }
  }
}
