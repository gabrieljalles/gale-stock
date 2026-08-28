import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from './settings.service';

// Roda a cada minuto e fecha a loja de verdade (grava o horário no
// WorkDay) assim que bate a hora configurada em "Fechamento automático".
// Fechamento manual (via toggle) já é tratado em SettingsService.updateSettings.
@Injectable()
export class StoreScheduleCron {
  private readonly logger = new Logger(StoreScheduleCron.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoClose() {
    const settings = await this.settingsService.getSettings();

    if (!settings.storeOpen || !settings.autoCloseEnabled) return;

    const currentHour = new Date().getHours();
    if (currentHour !== settings.storeCloseHour) return;

    await this.settingsService.autoCloseStore();
    this.logger.log(
      `Loja fechada automaticamente às ${settings.storeCloseHour}h.`,
    );
  }
}
