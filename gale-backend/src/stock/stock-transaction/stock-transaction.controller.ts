import { Body, Controller, Delete, HttpException, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { StockTransactionService } from "./stock-transaction.service";
import { CreateStockTransactionDto } from "./dto/create-transaction.dto";
import { UpdateInstallmentDto } from "./dto/update-transaction.dto";

@Controller('stock-transaction')
export class StockTransactionController{
    constructor(private readonly stockTransactionService: StockTransactionService) {}
    
    @Post()
    async create(@Body() dto: CreateStockTransactionDto){
        try{
            return await this.stockTransactionService.create(dto);
        } catch (error){
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
    async delete(@Param('id') id: string){
        try{
            const deleted = await this.stockTransactionService.delete(id);
            return {
                message: 'Transação deletada com sucesso',
                deleted,
            };
        }catch(err){
            console.error('Error to delete transaction:', err);
            throw new HttpException('Erro ao deletar transação', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Patch('/installment/:id')
    async updateInstallmentPaidDate(
        @Param('id') id:string,
        @Body() dto: UpdateInstallmentDto,
    ) {
        return this.stockTransactionService.updateInstallment(id, dto);
    }
}

