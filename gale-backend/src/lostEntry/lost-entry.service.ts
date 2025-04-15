import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LostEntryRepository } from "./lost-entry.repository";
import { CatalogService } from "src/catalog/catalog.service";
import { CreateLostEntryDto } from "./dto/create-lost-entry.dto";

@Injectable()
export class LostEntryService{
    constructor(
        private readonly repository: LostEntryRepository,
        private readonly catalogService: CatalogService
    ){}

    async createLoss(dto: CreateLostEntryDto){

        return this.repository.runInTransaction(async (tx) => {
            try{
                const product = await this.catalogService.findProductById(dto.productId, tx);

                if(!product){
                    throw new NotFoundException('Produto não encontrado.');
                }

                if(dto.quantity< 0){
                    throw new BadRequestException('Quantidade não pode ser negativa');
                }

                const loss = await this.repository.createLoss(dto,tx);

                await this.catalogService.adjustStock(
                    dto.productId,
                    {stock: dto.quantity},
                    'decrement',
                    tx
                );
                console.log('✅ Loss registered and stock adjusted.');
                return loss;
            }catch(err){    
                console.error('❌ Error declaring a loss:', err);
                throw  err;
            }
        })
        
    }

    async deleteLoss(id : string){
        return this.repository.runInTransaction(async (tx) => {

            try{
                const loss = this.repository.findLossById(id);

                if(!loss){
                    throw new NotFoundException('Perda não encontrada.');
                }

                const deletedLoss = await this.repository.deleteLoss(id, tx);

                await  this.catalogService.adjustStock(
                    deletedLoss.productId,
                    {stock: deletedLoss.quantity},
                    'increment',
                    tx
                )

                console.log('✅ Loss excluded and stock adjusted.')
                return deletedLoss;
            }catch(err){
                console.error('❌ Error deleting a loss:', err);
            }
        })
    }
}