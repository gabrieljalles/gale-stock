import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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
}
