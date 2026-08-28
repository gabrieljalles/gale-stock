import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('margin-trend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getMarginTrend(@Query('days') days?: string) {
    return this.service.getMarginTrend(this.parseDays(days));
  }

  @Get('product-margin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getProductMarginTrend(
    @Query('productId') productId?: string,
    @Query('days') days?: string,
  ) {
    if (!productId) {
      throw new BadRequestException('productId é obrigatório.');
    }
    return this.service.getProductMarginTrend(
      productId,
      this.parseDays(days),
    );
  }

  private parseDays(days?: string): number {
    const parsed = Number(days);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 365) return 30;
    return parsed;
  }
}
