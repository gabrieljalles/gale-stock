import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { CatalogModule } from 'src/catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService],
})
export class OrderModule {}
