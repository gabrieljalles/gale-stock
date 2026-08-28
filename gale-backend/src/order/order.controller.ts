import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateFullOrderDto } from './dto/create-order.dto';
import { CloseTabDto } from './dto/close-tab.dto';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post('shopper')
  @UseGuards(JwtAuthGuard)
  createOrderByShopper(@Body() body: CreateFullOrderDto, @Req() req: any) {
    return this.service.createOrderByShopper(body, req.user?.role);
  }

  @Get('open-tabs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getOpenTabs() {
    return this.service.getOpenTabs();
  }

  @Post('close-tab')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  closeTab(@Body() dto: CloseTabDto) {
    return this.service.closeTab(
      dto.clientId,
      dto.transactionType,
      dto.interestAmount,
    );
  }
}
