import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { StoreOverride } from '@prisma/client';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getSettings() {
    return this.service.getSettings();
  }

  // Vitrine: precisa saber se a loja está aberta e quanto custa a entrega
  // antes de o cliente ter conta.
  @Get('public')
  @Public()
  getPublicSettings() {
    return this.service.getPublicSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateSettings(@Body() dto: UpdateSettingsDto, @Req() req: any) {
    return this.service.updateSettings(dto, req.user?.id);
  }

  // ---------- Grade semanal ----------

  @Get('schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getSchedules() {
    return this.service.getSchedules();
  }

  @Put('schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateSchedules(@Body() dto: UpdateScheduleDto) {
    return this.service.updateSchedules(dto);
  }

  @Get('store-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getStoreStatus() {
    return this.service.getStoreStatus();
  }

  /**
   * Intervenção manual do Admin por cima da grade.
   * `mode` null volta a loja para o automático.
   */
  @Post('override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  setOverride(@Body('mode') mode: string | null) {
    if (mode === null || mode === undefined || mode === '') {
      return this.service.setOverride(null);
    }
    if (mode !== StoreOverride.ForceOpen && mode !== StoreOverride.ForceClose) {
      throw new BadRequestException(
        'mode deve ser ForceOpen, ForceClose ou vazio.',
      );
    }
    return this.service.setOverride(mode);
  }
}
