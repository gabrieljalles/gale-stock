import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StockTransactionService } from './stock-transaction.service';
import { StockTransactionController } from './stock-transaction.controller';
import { StockTransactionRepository } from './stock-transaction.repository';


@Module({
  imports:[PrismaModule],
  controllers: [StockTransactionController],
  providers: [StockTransactionRepository, StockTransactionService],
})
export class StockTransactionModule {}
