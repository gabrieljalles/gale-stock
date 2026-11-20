import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import {
  QuotePointsDto,
  UpdatePointsSettingsDto,
  UpdatePointsTiersDto,
} from './dto/update-points-settings.dto';
import { TransactionType } from '@prisma/client';

@Controller('points')
export class PointsController {
  constructor(private readonly service: PointsService) {}

  // ---------- Público ----------

  /**
   * Regras vigentes, pra página explicativa de pontos.
   *
   * Aberta de propósito: o cliente precisa entender o programa ANTES de
   * criar conta, e a página tem que mostrar exatamente o que o motor
   * aplica — não uma cópia escrita à mão que envelhece.
   */
  @Get('rules')
  @Public()
  getPublicRules() {
    return this.service.getPublicRules();
  }

  /** "Você foi convidado por Fulano" na tela de cadastro. Só o primeiro nome. */
  @Get('referral/:code')
  @Public()
  describeReferral(@Param('code') code: string) {
    return this.service.describeReferralCode(code);
  }

  // ---------- Cliente ----------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMySummary(@Req() req: any) {
    return this.service.getMySummary(req.user.id);
  }

  @Get('me/statement')
  @UseGuards(JwtAuthGuard)
  getMyStatement(@Req() req: any, @Query('limit') limit?: string) {
    return this.service.getMyStatement(req.user.id, Number(limit) || 50);
  }

  /** Gera o código na primeira chamada e devolve o mesmo daí em diante. */
  @Post('me/referral-code')
  @UseGuards(JwtAuthGuard)
  async createReferralCode(@Req() req: any) {
    return { referralCode: await this.service.getOrCreateReferralCode(req.user.id) };
  }

  /**
   * Simulação do ganho, usada pelo checkout.
   *
   * POST porque é um cálculo sobre o carrinho inteiro, não um recurso
   * endereçável — e o corpo cresce junto com as opções de pagamento.
   */
  @Post('me/quote')
  @UseGuards(JwtAuthGuard)
  quote(@Body() dto: QuotePointsDto, @Req() req: any) {
    return this.service.quote(
      req.user.id,
      dto.productTotal,
      dto.transactionType as TransactionType | undefined,
      dto.pointsToRedeem ?? 0,
    );
  }

  // ---------- Administração ----------
  //
  // Não existe endpoint para dar ou tirar pontos de alguém: crédito e
  // débito são consequência de compra, resgate, validade e inatividade.
  // O Admin mexe nas REGRAS, nunca no saldo.

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getConfig() {
    return this.service.getConfig();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateConfig(@Body() dto: UpdatePointsSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Put('tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateTiers(@Body() dto: UpdatePointsTiersDto) {
    return this.service.updateTiers(dto);
  }

  @Post('config/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  resetConfig() {
    return this.service.resetConfig();
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getSummary(@Query('days') days?: string) {
    return this.service.getHealthSummary(Number(days) || 30);
  }
}
