import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';
import { WorkDayModule } from 'src/work-day/work-day.module';

@Module({
  // WorkDayModule entra para descobrir qual é o dia de trabalho aberto
  // (pizza do Resumo). Não há ciclo: WorkDay não conhece Reports.
  imports: [WorkDayModule],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
