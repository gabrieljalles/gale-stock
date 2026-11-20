import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceRepository } from './finance.repository';
import { FinanceService } from './finance.service';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  // SettingsModule traz as configurações do Simples Nacional usadas na DRE.
  imports: [SettingsModule],
  controllers: [FinanceController],
  providers: [FinanceRepository, FinanceService],
})
export class FinanceModule {}
