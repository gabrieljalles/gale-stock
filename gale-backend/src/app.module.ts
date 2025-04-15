import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './products/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { StockTransactionModule } from './stock/stock-transaction/stock-transaction.module';
import { CatalogModule } from './catalog/catalog.module';
import { LostEntryModule } from './lostEntry/lost-entry.module';

@Module({
  imports: [PrismaModule, ProductModule,SupplierModule,StockTransactionModule, CatalogModule, LostEntryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
