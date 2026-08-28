import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { WorkDayService } from 'src/work-day/work-day.service';

const DEFAULT_SETTINGS = {
  storeOpen: true,
  autoCloseEnabled: false,
  storeCloseHour: 22,
  nightPriceEnabled: true,
  nightPriceStartHour: 23,
  nightPriceEndHour: 7,
  nightPriceMarkupPercent: 5,
  ifoodMarkupPercent: 27,
  freightPrice: 5,
  deliveryEnabled: true,
  creditCardFeePercent: 0,
  debitCardFeePercent: 0,
  pixFeePercent: 0,
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly workDayService: WorkDayService,
  ) {}

  async getSettings() {
    const settings = await this.repository.get();
    return settings ?? { id: 1, ...DEFAULT_SETTINGS, updatedAt: new Date() };
  }

  async updateSettings(dto: UpdateSettingsDto, requesterId?: string) {
    if (dto.storeOpen !== undefined) {
      const current = await this.getSettings();
      if (dto.storeOpen !== current.storeOpen) {
        if (dto.storeOpen) {
          await this.workDayService.openStore(requesterId);
        } else {
          await this.workDayService.closeStore(requesterId);
        }
      }
    }

    return this.repository.upsert(dto);
  }

  // Usado pelo job agendado de fechamento automático: fecha a loja de
  // verdade (grava o momento no WorkDay), sem depender de uma requisição
  // HTTP de um Admin.
  async autoCloseStore() {
    await this.workDayService.closeStore();
    return this.repository.upsert({ storeOpen: false });
  }

  // Considera o interruptor manual e, se ligado, o fechamento automático
  // por horário. Usado para bloquear pedidos de usuários comuns; Admin
  // sempre pode vender, independente desse resultado.
  async isStoreOpenNow(date: Date = new Date()): Promise<boolean> {
    const settings = await this.getSettings();

    if (!settings.storeOpen) return false;
    if (!settings.autoCloseEnabled) return true;

    const hour = date.getHours();
    return hour < settings.storeCloseHour;
  }

  async isNightPrice(date: Date = new Date()): Promise<boolean> {
    const { nightPriceEnabled, nightPriceStartHour, nightPriceEndHour } =
      await this.getSettings();

    if (!nightPriceEnabled) return false;

    const hour = date.getHours();

    if (nightPriceStartHour === nightPriceEndHour) return false;

    // Janela que cruza a meia-noite (ex: 23 -> 7)
    if (nightPriceStartHour > nightPriceEndHour) {
      return hour >= nightPriceStartHour || hour < nightPriceEndHour;
    }

    // Janela dentro do mesmo dia (ex: 1 -> 5)
    return hour >= nightPriceStartHour && hour < nightPriceEndHour;
  }

  // divisor usado para embutir uma % de acréscimo/comissão no preço
  // (preço final = preço base / divisor)
  private percentToDivisor(percent: number): number {
    return 1 - Number(percent) / 100;
  }

  async getPriceDivisors(): Promise<{
    nightPriceDivisor: number;
    ifoodPriceDivisor: number;
  }> {
    const { nightPriceMarkupPercent, ifoodMarkupPercent } =
      await this.getSettings();

    return {
      nightPriceDivisor: this.percentToDivisor(Number(nightPriceMarkupPercent)),
      ifoodPriceDivisor: this.percentToDivisor(Number(ifoodMarkupPercent)),
    };
  }
}
