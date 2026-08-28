import { Controller, Get, UseGuards } from '@nestjs/common';
import { WorkDayService } from './work-day.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('work-days')
export class WorkDayController {
  constructor(private readonly service: WorkDayService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  findAll() {
    return this.service.getWorkDaysReport();
  }

  @Get('current/top-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getCurrentTopProducts() {
    return this.service.getCurrentTopProducts();
  }
}
