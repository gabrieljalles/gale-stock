import { Module } from '@nestjs/common';
import { WorkDayController } from './work-day.controller';
import { WorkDayRepository } from './work-day.repository';
import { WorkDayService } from './work-day.service';

@Module({
  controllers: [WorkDayController],
  providers: [WorkDayRepository, WorkDayService],
  exports: [WorkDayService],
})
export class WorkDayModule {}
