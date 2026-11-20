import { Module } from '@nestjs/common';
import { PointsController } from './points.controller';
import { PointsRepository } from './points.repository';
import { PointsService } from './points.service';
import { PointsCron } from './points.cron';

/**
 * O módulo não importa Order nem User de propósito: quem chama o motor é
 * a venda, no instante em que o pagamento entra. Inverter isso criaria
 * ciclo — e pior, deixaria a pontuação decidindo quando uma venda acontece.
 */
@Module({
  controllers: [PointsController],
  providers: [PointsRepository, PointsService, PointsCron],
  exports: [PointsService],
})
export class PointsModule {}
