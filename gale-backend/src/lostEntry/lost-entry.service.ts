import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLostEntryDto } from './dto/create-lost-entry.dto';
import { LostEntryRepository } from './lost-entry.repository';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class LostEntryService {
  constructor(
    private readonly lostEntryRepository: LostEntryRepository,
    private readonly catalogService: CatalogService,
  ) {}

  async registerLoss(createLostEntryDto: CreateLostEntryDto) {
    const { productId, validityDate, quantity, reasonLoss, note } =
      createLostEntryDto;

    // Executar toda a operação em uma transação
    return this.lostEntryRepository.runInTransaction(async (tx) => {
      let stockEntries;

      // Se data de validade foi fornecida, buscar por produto e data específica
      if (validityDate) {
        const parsedValidityDate = new Date(validityDate);
        stockEntries =
          await this.lostEntryRepository.findMultipleStockEntriesByProductAndValidity(
            productId,
            parsedValidityDate,
            tx,
          );

        if (!stockEntries || stockEntries.length === 0) {
          throw new NotFoundException(
            `Não encontrado estoque para o produto ${productId} com data de validade ${validityDate}`,
          );
        }
      } else {
        // Se data de validade não foi fornecida, buscar todas as entradas disponíveis
        stockEntries =
          await this.lostEntryRepository.findMultipleStockEntriesByProductId(
            productId,
            tx,
          );

        if (!stockEntries || stockEntries.length === 0) {
          throw new NotFoundException(
            `Não encontrado estoque disponível para o produto ${productId}`,
          );
        }
      }

      // Verificar se há estoque total suficiente
      const totalAvailableStock = stockEntries.reduce(
        (sum, entry) => sum + entry.quantityOnStock,
        0,
      );

      if (totalAvailableStock < quantity) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${totalAvailableStock}, Solicitado: ${quantity}`,
        );
      }

      // Distribuir a perda entre as entradas de estoque (FIFO)
      let remainingQuantityToLose = quantity;
      const lossEntries: any[] = [];
      const updatedStockEntries: any[] = [];

      for (const stockEntry of stockEntries) {
        if (remainingQuantityToLose <= 0) break;

        // Calcular quanto será perdido desta entrada específica
        const quantityFromThisEntry = Math.min(
          stockEntry.quantityOnStock,
          remainingQuantityToLose,
        );

        // Atualizar quantidade em estoque
        const newQuantity = stockEntry.quantityOnStock - quantityFromThisEntry;
        await this.lostEntryRepository.updateStockQuantity(
          stockEntry.id,
          newQuantity,
          tx,
        );

        // Criar registro de perda para esta entrada específica
        const lossEntry = await this.lostEntryRepository.createLoss(
          {
            productId,
            stockEntryDetailId: stockEntry.id,
            quantity: quantityFromThisEntry,
            reasonLoss,
            note,
          },
          tx,
        );

        lossEntries.push(lossEntry);
        updatedStockEntries.push({
          id: stockEntry.id,
          previousQuantity: stockEntry.quantityOnStock,
          newQuantity,
          quantityLost: quantityFromThisEntry,
          validityDate: stockEntry.validityDate,
        });

        // Atualizar quantidade restante a ser perdida
        remainingQuantityToLose -= quantityFromThisEntry;
      }

      // Verificar se o produto ficou sem estoque e atualizar catálogo
      await this.checkAndUpdateCatalogAvailability(productId, tx);

      return {
        success: true,
        totalQuantityLost: quantity,
        lossEntries,
        updatedStockEntries,
        summary: {
          totalLossRecords: lossEntries.length,
          stockEntriesAffected: updatedStockEntries.length,
        },
      };
    });
  }

  async deleteLoss(id: string) {
    return this.lostEntryRepository.runInTransaction(async (tx) => {
      // Buscar a entrada de perda
      const lossEntry = await this.lostEntryRepository.findLossById(id);

      if (!lossEntry) {
        throw new NotFoundException(`Registro de perda ${id} não encontrado`);
      }

      // Buscar o StockEntryDetail relacionado usando uma query raw se necessário
      // Por enquanto, vamos assumir que o campo existe no modelo
      const stockEntryDetailId = (lossEntry as any).stockEntryDetailId;

      if (!stockEntryDetailId) {
        throw new NotFoundException(
          `StockEntryDetailId não encontrado no registro de perda ${id}`,
        );
      }

      const stockEntryDetail =
        await this.lostEntryRepository.findStockEntryById(
          stockEntryDetailId,
          tx,
        );

      if (!stockEntryDetail) {
        throw new NotFoundException(
          `Entrada de estoque ${stockEntryDetailId} não encontrada`,
        );
      }

      // Restaurar a quantidade no estoque
      const restoredQuantity =
        stockEntryDetail.quantityOnStock + lossEntry.quantity;

      await this.lostEntryRepository.updateStockQuantity(
        stockEntryDetail.id,
        restoredQuantity,
        tx,
      );

      // Deletar o registro de perda
      await this.lostEntryRepository.deleteLoss(id, tx);

      // Verificar se o produto voltou a ter estoque e atualizar catálogo
      const productId = lossEntry.productId;
      await this.checkAndRestoreCatalogAvailability(productId, tx);

      return {
        deletedLossEntry: lossEntry,
        stockEntryDetail: {
          id: stockEntryDetail.id,
          previousQuantity: stockEntryDetail.quantityOnStock,
          restoredQuantity,
          validityDate: stockEntryDetail.validityDate,
        },
      };
    });
  }

  async findLossById(id: string) {
    const lossEntry = await this.lostEntryRepository.findLossById(id);

    if (!lossEntry) {
      throw new NotFoundException(`Registro de perda ${id} não encontrado`);
    }

    return lossEntry;
  }

  async findAllLosses() {
    return this.lostEntryRepository.findAllLosses();
  }

  private async checkAndUpdateCatalogAvailability(productId: string, tx: any) {
    // Verificar se ainda há estoque disponível para o produto
    const totalStock = await this.getTotalStockByProductId(productId, tx);

    // Se não há mais estoque, marcar como indisponível no catálogo
    if (totalStock === 0) {
      await this.catalogService.updateProductsAvailability(
        [productId],
        false,
        tx,
      );
    }
  }

  private async checkAndRestoreCatalogAvailability(productId: string, tx: any) {
    // Verificar se o produto voltou a ter estoque disponível
    const totalStock = await this.getTotalStockByProductId(productId, tx);

    // Se há estoque disponível, marcar como disponível no catálogo
    if (totalStock > 0) {
      await this.catalogService.updateProductsAvailability(
        [productId],
        true,
        tx,
      );
    }
  }

  private async getTotalStockByProductId(productId: string, tx: any) {
    // Buscar todas as entradas de estoque para o produto e somar quantityOnStock
    const stockEntries =
      await this.lostEntryRepository.findMultipleStockEntriesByProductId(
        productId,
        tx,
      );

    return stockEntries.reduce(
      (total, entry) => total + entry.quantityOnStock,
      0,
    );
  }
}
