import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { WorkDayService } from 'src/work-day/work-day.service';
import { StoreOverride } from '@prisma/client';
import {
  DaySchedule,
  formatTime,
  isOpenBySchedule,
  nextTransition,
} from 'src/utils/store-hours.utils';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

// Grade padrão de quem nunca configurou nada: aberta todo dia, 8h às 22h.
const DEFAULT_SCHEDULE: DaySchedule[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  isOpen: true,
  openHour: 8,
  openMinute: 0,
  closeHour: 22,
  closeMinute: 0,
}));

const DEFAULT_SETTINGS = {
  storeOpen: true,
  autoScheduleEnabled: false,
  storeOverride: null as StoreOverride | null,
  overrideUntil: null as Date | null,
  nightPriceEnabled: true,
  nightPriceStartHour: 23,
  nightPriceEndHour: 7,
  nightPriceMarkupPercent: 5,
  ifoodMarkupPercent: 27,
  freightPrice: 5,
  deliveryEnabled: true,
  oneManArmyMode: false,
  city: 'Ituiutaba',
  state: 'MG',
  creditCardFeePercent: 0,
  debitCardFeePercent: 0,
  pixFeePercent: 0,
  defaultOnTheBillLimit: 200,
  simplesNacionalEnabled: false,
  taxPercent: 0,
  taxDeduction: 0,
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

  // Recorte público das configurações, pra vitrine. Só o que o cliente
  // precisa saber — nada de taxas de maquininha, % de iFood ou markup.
  async getPublicSettings() {
    const settings = await this.getSettings();

    // "Fecha às HH:MM" só faz sentido com a loja aberta e uma virada de
    // fechamento à vista; fora disso vira informação enganosa.
    const open = await this.isStoreOpenNow();
    const upcoming = settings.autoScheduleEnabled
      ? nextTransition(await this.getSchedules())
      : null;

    return {
      storeOpen: open,
      closesAt:
        open && upcoming && !upcoming.opens
          ? formatTime(upcoming.at.getHours(), upcoming.at.getMinutes())
          : null,
      deliveryEnabled: settings.deliveryEnabled,
      freightPrice: Number(settings.freightPrice),
      city: settings.city,
      state: settings.state,
    };
  }

  // Considera a intervenção manual, a grade semanal e o interruptor de
  // Configurações, nessa ordem. Usado para bloquear pedidos de usuários
  // comuns; Admin sempre pode vender, independente desse resultado.
  async isStoreOpenNow(date: Date = new Date()): Promise<boolean> {
    const settings = await this.getSettings();

    // A intervenção manual vence tudo enquanto vale — é ela que dá
    // autonomia pro Admin fechar num dia normal ou abrir num feriado.
    const override = this.activeOverride(settings, date);
    if (override) return override === StoreOverride.ForceOpen;

    // Sem automação, quem manda é o botão de Configurações.
    if (!settings.autoScheduleEnabled) return settings.storeOpen;

    return isOpenBySchedule(await this.getSchedules(), date);
  }

  /** Intervenção manual ainda válida, ou null se não há/expirou. */
  private activeOverride(
    settings: { storeOverride: StoreOverride | null; overrideUntil: Date | null },
    date: Date,
  ): StoreOverride | null {
    if (!settings.storeOverride) return null;
    if (settings.overrideUntil && settings.overrideUntil <= date) return null;
    return settings.storeOverride;
  }

  // ---------- Grade semanal ----------

  /** Os 7 dias. Sem nada gravado, devolve a grade padrão. */
  async getSchedules(): Promise<DaySchedule[]> {
    const saved = await this.repository.findSchedules();
    if (saved.length === 0) return DEFAULT_SCHEDULE;

    // Completa dias faltantes com o padrão, pra grade nunca ter buraco.
    return DEFAULT_SCHEDULE.map(
      (fallback) =>
        saved.find((day) => day.weekday === fallback.weekday) ?? fallback,
    );
  }

  async updateSchedules(dto: UpdateScheduleDto) {
    await this.repository.replaceSchedules(dto.days);
    // Salvar a grade pode mudar o estado agora mesmo (ex.: apagar o dia de
    // hoje). Sincroniza na hora em vez de esperar o próximo minuto do cron.
    await this.syncStoreWithSchedule();
    return this.getSchedules();
  }

  /**
   * Intervenção manual do Admin.
   *
   * Expira sozinha na próxima virada da grade: forçar fechado vale até o
   * próximo horário de abertura, forçar aberto vale até o próximo
   * fechamento. Sem esse prazo, um clique num sábado deixaria a loja
   * travada para sempre sem ninguém lembrar do porquê.
   */
  async setOverride(mode: StoreOverride | null) {
    if (!mode) {
      await this.repository.setOverride(null, null);
      await this.syncStoreWithSchedule();
      return this.getStoreStatus();
    }

    const upcoming = nextTransition(await this.getSchedules());
    // Sem nenhuma virada à vista (grade toda fechada), 24h é um prazo
    // razoável — melhor que travar indefinidamente.
    const until =
      upcoming?.at ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.repository.setOverride(mode, until);
    await this.applyStoreOpen(mode === StoreOverride.ForceOpen);

    return this.getStoreStatus();
  }

  /**
   * Alinha o estado persistido (e o dia de trabalho) com o que a grade e a
   * intervenção dizem agora. Chamada pelo cron a cada minuto e sempre que
   * a configuração muda.
   */
  async syncStoreWithSchedule(date: Date = new Date()) {
    const settings = await this.getSettings();

    // Limpa intervenção vencida antes de decidir qualquer coisa.
    if (
      settings.storeOverride &&
      settings.overrideUntil &&
      settings.overrideUntil <= date
    ) {
      await this.repository.setOverride(null, null);
    }

    const shouldBeOpen = await this.isStoreOpenNow(date);
    return this.applyStoreOpen(shouldBeOpen);
  }

  /** Grava o estado e abre/fecha o dia de trabalho, se mudou. */
  private async applyStoreOpen(shouldBeOpen: boolean) {
    const settings = await this.getSettings();
    if (settings.storeOpen === shouldBeOpen) return false;

    if (shouldBeOpen) {
      await this.workDayService.openStore();
    } else {
      await this.workDayService.closeStore();
    }
    await this.repository.upsert({ storeOpen: shouldBeOpen });
    return true;
  }

  /** Status consolidado, pra tela explicar o que está acontecendo. */
  async getStoreStatus() {
    const settings = await this.getSettings();
    const now = new Date();
    const schedules = await this.getSchedules();
    const override = this.activeOverride(settings, now);
    const upcoming = settings.autoScheduleEnabled
      ? nextTransition(schedules, now)
      : null;

    return {
      isOpen: await this.isStoreOpenNow(now),
      autoScheduleEnabled: settings.autoScheduleEnabled,
      override,
      overrideUntil: override ? settings.overrideUntil : null,
      nextTransition: upcoming
        ? { at: upcoming.at.toISOString(), opens: upcoming.opens }
        : null,
    };
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
