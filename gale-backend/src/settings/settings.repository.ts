import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { StoreOverride } from '@prisma/client';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    return this.prisma.siteSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
  }

  async upsert(data: UpdateSettingsDto) {
    return this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
  }

  // A intervenção manual não passa pelo DTO de configurações: ela é um
  // comando ("feche agora"), não um campo de formulário.
  async setOverride(
    storeOverride: StoreOverride | null,
    overrideUntil: Date | null,
  ) {
    return this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, storeOverride, overrideUntil },
      update: { storeOverride, overrideUntil },
    });
  }

  // ---------- Grade semanal ----------

  async findSchedules() {
    return this.prisma.storeSchedule.findMany({ orderBy: { weekday: 'asc' } });
  }

  /**
   * Grava a semana inteira de uma vez. Em transação porque uma grade
   * meio salva (três dias novos, quatro velhos) abriria ou fecharia a loja
   * numa combinação que ninguém configurou.
   */
  async replaceSchedules(
    days: {
      weekday: number;
      isOpen: boolean;
      openHour: number;
      openMinute: number;
      closeHour: number;
      closeMinute: number;
    }[],
  ) {
    return this.prisma.$transaction(
      days.map((day) =>
        this.prisma.storeSchedule.upsert({
          where: { weekday: day.weekday },
          create: day,
          update: day,
        }),
      ),
    );
  }
}
