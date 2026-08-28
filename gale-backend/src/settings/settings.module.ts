import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';
import { WorkDayModule } from 'src/work-day/work-day.module';
import { StoreScheduleCron } from './store-schedule.cron';

@Module({
  imports: [WorkDayModule],
  controllers: [SettingsController],
  providers: [SettingsRepository, SettingsService, StoreScheduleCron],
  exports: [SettingsService],
})
export class SettingsModule {}
