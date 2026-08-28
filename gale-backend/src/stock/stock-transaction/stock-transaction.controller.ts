import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StockTransactionService } from './stock-transaction.service';
import { CreateStockTransactionDto } from './dto/create-transaction.dto';
import { UpdateInstallmentDto } from './dto/update-transaction.dto';
import { UpdateStockEntryDetailDto } from './dto/update-stock-entry-detail.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('stock-transaction')
export class StockTransactionController {
  constructor(
    private readonly stockTransactionService: StockTransactionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getTransactions() {
    return await this.stockTransactionService.getTransactions();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async create(@Body() dto: CreateStockTransactionDto) {
    try {
      return await this.stockTransactionService.create(dto);
    } catch (error) {
      console.error('Error to create transaction:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro ao processar a transação',
          details: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async delete(@Param('id') id: string) {
    try {
      const deleted = await this.stockTransactionService.delete(id);
      return {
        message: 'Transação deletada com sucesso',
        deleted,
      };
    } catch (err) {
      console.error('Error to delete transaction:', err);
      throw new HttpException(
        'Erro ao deletar transação',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('product-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getStockEntryDetails() {
    return await this.stockTransactionService.getStockEntryDetails();
  }

  @Get('installments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getInstallmentsSummary() {
    return await this.stockTransactionService.getInstallments();
  }

  @Get(':id/installments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getInstallments(@Param('id') id: string) {
    return await this.stockTransactionService.getInstallmentsByTransaction(id);
  }

  @Patch('/entry-detail/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async updateStockEntryDetail(
    @Param('id') id: string,
    @Body() dto: UpdateStockEntryDetailDto,
  ) {
    try {
      const result = await this.stockTransactionService.updateStockEntryDetail(
        id,
        dto,
      );
      return {
        message: 'Entrada de estoque atualizada com sucesso',
        entry: result,
      };
    } catch (error) {
      console.error('Error updating stock entry detail:', error);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            {
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'Erro ao atualizar entrada de estoque',
              details: error.message || error,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  @Patch('/installment/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async updateInstallmentPaidDate(
    @Param('id') id: string,
    @Body() dto: UpdateInstallmentDto,
  ) {
    try {
      const result = await this.stockTransactionService.updateInstallment(
        id,
        dto,
      );
      return {
        message: 'Parcela atualizada com sucesso',
        installment: result,
      };
    } catch (error) {
      console.error('Error updating installment:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro ao atualizar parcela',
          details: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('/installment/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async toggleInstallmentPaidDate(@Param('id') id: string) {
    try {
      const result = await this.stockTransactionService.updateInstallment(
        id,
        {},
      );
      return {
        message: 'Status da parcela alterado com sucesso',
        installment: result,
      };
    } catch (error) {
      console.error('Error toggling installment:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro ao alterar status da parcela',
          details: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
