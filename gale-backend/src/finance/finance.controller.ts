import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { UpsertFixedExpenseDto } from './dto/fixed-expense.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  /** Competências com movimento, pro seletor de mês. */
  @Get('months')
  findAvailableMonths() {
    return this.service.findAvailableMonths();
  }

  @Get('income-statement')
  getIncomeStatement(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const { parsedYear, parsedMonth } = this.parseCompetence(year, month);
    return this.service.getIncomeStatement(parsedYear, parsedMonth);
  }

  @Get('expenses')
  findExpenses(@Query('year') year?: string, @Query('month') month?: string) {
    const { parsedYear, parsedMonth } = this.parseCompetence(year, month);
    return this.service.findExpenses(parsedYear, parsedMonth);
  }

  @Post('expenses')
  upsertExpense(@Body() dto: UpsertFixedExpenseDto) {
    return this.service.upsertExpense(dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    return this.service.deleteExpense(id);
  }

  // Sem ano/mês na query, assume a competência atual — é o que a tela pede
  // ao abrir.
  private parseCompetence(year?: string, month?: string) {
    const now = new Date();
    const parsedYear = year ? Number(year) : now.getFullYear();
    const parsedMonth = month ? Number(month) : now.getMonth() + 1;

    if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth)) {
      throw new BadRequestException('Competência inválida.');
    }
    return { parsedYear, parsedMonth };
  }
}
