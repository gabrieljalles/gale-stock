import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './products/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { StockTransactionModule } from './stock/stock-transaction/stock-transaction.module';
import { CatalogModule } from './catalog/catalog.module';
import { LostEntryModule } from './lostEntry/lost-entry.module';
// import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [PrismaModule, ProductModule,SupplierModule,StockTransactionModule, CatalogModule, LostEntryModule, AuthModule, UserModule, OrderModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,   
    },

  ],
})
export class AppModule {}
