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
// src/app.module.ts
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './user/mail.service';
import { join } from 'path';
import { SettingsModule } from './settings/settings.module';
import { WorkDayModule } from './work-day/work-day.module';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        secure: false,
        port: +(process.env.MAIL_PORT || 587),
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '🍻Galé - Delivery de bebidas🍻',
      },
      template: {
        dir: join(process.cwd(), 'src', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
    PrismaModule,
    ProductModule,
    SupplierModule,
    StockTransactionModule,
    CatalogModule,
    LostEntryModule,
    AuthModule,
    UserModule,
    OrderModule,
    SettingsModule,
    WorkDayModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    MailService,
    AppService,
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
