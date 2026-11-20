import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateFullOrderDto } from './dto/create-order.dto';
import { CloseTabDto } from './dto/close-tab.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AssignDriverDto, ToggleChecklistDto } from './dto/kanban.dto';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
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

  // Pedido feito pelo próprio cliente na vitrine.
  @Post('customer')
  @UseGuards(JwtAuthGuard)
  createOrderByCustomer(@Body() dto: CreateCustomerOrderDto, @Req() req: any) {
    return this.service.createOrderByCustomer(dto, req.user.id);
  }

  // "Meus pedidos": cada cliente vê só os próprios. O id vem do token,
  // nunca da query — senão bastaria trocar o parâmetro pra ler os pedidos
  // de outra pessoa.
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  findMyOrders(@Req() req: any) {
    return this.service.findMyOrders(req.user.id);
  }

  // Situação da fila do cliente: quantos pedidos ele tem em andamento e
  // se algum deles ainda aceita itens novos. Alimenta o checkout.
  @Get('my-delivery-status')
  @UseGuards(JwtAuthGuard)
  getMyDeliveryOrderStatus(@Req() req: any) {
    return this.service.getMyDeliveryOrderStatus(req.user.id);
  }

  // Acrescenta itens a um pedido próprio que ainda não foi montado.
  @Post(':id/add-items')
  @UseGuards(JwtAuthGuard)
  addItemsToMyOrder(
    @Param('id') id: string,
    @Body() dto: AddOrderItemsDto,
    @Req() req: any,
  ) {
    return this.service.addItemsToMyOrder(id, req.user.id, dto.items);
  }

  @Get('open-tabs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getOpenTabs() {
    return this.service.getOpenTabs();
  }

  // Só Admin fecha notinha. Entregar a mercadoria não quita a dívida: a
  // conta fica aberta até o Admin registrar o recebimento aqui.
  @Post('close-tab')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  closeTab(@Body() dto: CloseTabDto) {
    return this.service.closeTab(
      dto.clientId,
      dto.transactionType,
      dto.interestAmount,
    );
  }

  @Get('sells')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getAllSells() {
    return this.service.findAllSells();
  }

  @Patch('sells/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  updateSale(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.service.updateSale(id, dto);
  }

  @Get('kanban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  // scope=today limita a coluna "Entregue" ao dia de trabalho aberto.
  getKanbanOrders(@Query('scope') scope?: string) {
    return this.service.getKanbanOrders(scope === 'today');
  }

  @Post(':id/start-preparing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  startPreparing(@Param('id') id: string) {
    return this.service.startPreparing(id);
  }

  @Patch(':id/checklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  toggleChecklistItem(@Param('id') id: string, @Body() dto: ToggleChecklistDto) {
    return this.service.toggleChecklistItem(id, dto);
  }

  @Patch(':id/assign-driver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.service.assignDriver(id, dto);
  }

  @Get('map-center')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  getMapCenter() {
    return this.service.getMapCenter();
  }

  @Post('geocode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  geocodePendingOrders(@Query('retryFailed') retryFailed?: string) {
    return this.service.geocodePendingOrders(retryFailed === 'true');
  }

  // Cancelamento devolve o estoque, então é só do Admin: não é uma
  // operação de balcão, mexe em inventário.
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  cancelOrder(@Param('id') id: string) {
    return this.service.cancelOrder(id);
  }

  @Post(':id/revert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  revertOrderStatus(@Param('id') id: string) {
    return this.service.revertOrderStatus(id);
  }

  @Post(':id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  markDelivered(@Param('id') id: string) {
    return this.service.markDelivered(id);
  }
}
