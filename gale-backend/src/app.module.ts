import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './products/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { StockTransactionModule } from './stock/stock-transaction/stock-transaction.module';

@Module({
  imports: [PrismaModule, ProductModule,SupplierModule,StockTransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
