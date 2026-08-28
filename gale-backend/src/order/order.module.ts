import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { CatalogModule } from 'src/catalog/catalog.module';
import { UserModule } from 'src/user/user.module';
import { SettingsModule } from 'src/settings/settings.module';
import { WorkDayModule } from 'src/work-day/work-day.module';

@Module({
  imports: [CatalogModule, UserModule, SettingsModule, WorkDayModule],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService],
})
export class OrderModule {}
