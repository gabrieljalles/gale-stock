import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from './settings.service';

/**
 * Aplica a grade semanal a cada minuto: abre a loja quando chega o horário
 * de abertura e fecha quando chega o de fechamento, gravando o dia de
 * trabalho de verdade.
 *
 * Roda mesmo com a automação desligada, porque uma intervenção manual
 * ("forçar fechado") precisa expirar sozinha de qualquer forma — é o
 * syncStoreWithSchedule que cuida das duas coisas.
 */
@Injectable()
export class StoreScheduleCron {
  private readonly logger = new Logger(StoreScheduleCron.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleSchedule() {
    const settings = await this.settingsService.getSettings();

    // Sem automação e sem intervenção pendente não há nada pra sincronizar:
    // quem manda é o botão manual, e mexer aqui desfaria o clique do Admin.
    if (!settings.autoScheduleEnabled && !settings.storeOverride) return;

    const changed = await this.settingsService.syncStoreWithSchedule();
    if (changed) {
      const status = await this.settingsService.getStoreStatus();
      this.logger.log(
        `Loja ${status.isOpen ? 'aberta' : 'fechada'} automaticamente pela grade.`,
      );
    }
  }
}
