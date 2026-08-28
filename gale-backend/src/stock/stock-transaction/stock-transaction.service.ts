import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStockTransactionDto } from './dto/create-transaction.dto';
import { StockTransactionRepository } from './stock-transaction.repository';
import { UpdateInstallmentDto } from './dto/update-transaction.dto';
import { UpdateStockEntryDetailDto } from './dto/update-stock-entry-detail.dto';
import { CatalogService } from 'src/catalog/catalog.service';
import { getLandedUnitCost } from '../../utils/landed-unit-cost.utils';

@Injectable()
export class StockTransactionService {
  findAllInstallments() {
    throw new Error('Method not implemented.');
  }
  constructor(
    private readonly repository: StockTransactionRepository,
    private readonly catalogService: CatalogService,
  ) {}

  async getTransactions() {
    return await this.repository.findAllTransactions();
  }

  async create(dto: CreateStockTransactionDto) {
    const { installments, stockEntryDetail, supplierId, ...rest } = dto;

    return this.repository.runInTransaction(async (tx) => {
      let transaction;

      try {
        let statusCheckout: string;

        if (
          dto.transactionType === 'DebitCard' ||
          dto.transactionType === 'Money' ||
          dto.transactionType === 'Pix'
        ) {
          statusCheckout = 'Concluded';
        } else {
          statusCheckout = 'Pending';
        }

        transaction = await this.repository.createTransaction(
          {
            supplier: {
              connect: { id: supplierId },
            },
            firstPaymentDate: dto.firstPaymentDate
              ? new Date(dto.firstPaymentDate)
              : undefined,
            transactionType: dto.transactionType,
            numberPayments: dto.numberPayments,
            totalProductCost: dto.totalProductCost,
            freightCost: dto.freightCost,
            feeCost: dto.feeCost,
            totalCost: dto.totalCost,
            nfeAccessKey: dto.nfeAccessKey,
            statusCheckout,
          },
          tx,
        );
        console.log('✅ Created transaction.');
      } catch (err) {
        console.error('❌ Error creating transaction:', err);
        throw err;
      }

      try {
        if (dto.numberPayments > 0 && dto.firstPaymentDate) {
          const firstDate = new Date(dto.firstPaymentDate);

          const shouldAutoPay = ['DebitCard', 'Money', 'Pix'].includes(
            dto.transactionType,
          );
          const paidDate = shouldAutoPay ? new Date() : null;

          const installmentsToCreate = Array.from({
            length: dto.numberPayments,
          }).map((_, index) => {
            const dueDate = new Date(firstDate);

            dueDate.setMonth(firstDate.getMonth() + index);

            return {
              stockTransactionId: transaction.id,
              installmentNumber: index + 1,
              dueDate,
              fragmentCost: +(dto.totalCost / dto.numberPayments).toFixed(2),
              paidDate,
            };
          });

          await this.repository.createInstallments(installmentsToCreate, tx);

          await tx.stockTransaction.update({
            where: { id: transaction.id },
            data: { firstPaymentDate: firstDate },
          });
          console.log('✅ Installments generated');
        }
      } catch (err) {
        console.error('❌ Error to create installments:', err);
        throw err;
      }

      try {
        if (stockEntryDetail?.length) {
          const totalQuantity = stockEntryDetail.reduce(
            (acc, item) => acc + item.initialQuantity,
            0,
          );

          const productIds = stockEntryDetail.map((p) => p.productId);
          const products = await this.repository.findProductNamesByIds(
            productIds,
            tx,
          );
          const productNameById = new Map(
            products.map((p) => [p.id, p.name]),
          );

          await this.repository.createStockEntryDetails(
            stockEntryDetail.map((p) => {
              const productName = productNameById.get(p.productId);

              if (!productName) {
                throw new NotFoundException(
                  `Produto ${p.productId} não encontrado`,
                );
              }

              return {
                stockTransactionId: transaction.id,
                productId: p.productId,
                productName,
                baseUnitCost: p.baseUnitCost,
                initialQuantity: p.initialQuantity,
                quantityOnStock: p.initialQuantity,
                validityDate: new Date(p.validityDate),
                totalProductCost: p.totalProductCost,
                landedUnitCost: getLandedUnitCost(p, {
                  ...dto,
                }),
              };
            }),
            tx,
          );

          // Atualizar catalog para marcar produtos como disponíveis
          await this.catalogService.updateProductsAvailability(
            productIds,
            true,
            tx,
          );
        }
        console.log('✅ Products inserted');
      } catch (err) {
        console.error('Error to insert products stocks', err);
        throw err;
      }
      return transaction;
    });
  }

  async delete(id: string) {
    return this.repository.runInTransaction(async (tx) => {
      const transaction = await this.repository.findUniqueTransaction(id, tx);

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      // Buscar todos os produtos da transação que será deletada
      const stockEntryDetails =
        await this.repository.findAllEntryDetailsByTransaction(id, tx);
      const productIds = stockEntryDetails.map((detail) => detail.productId);
      const stockEntryDetailIds = stockEntryDetails.map((detail) => detail.id);

      // Excluir todas as perdas relacionadas aos stockEntryDetails da transação
      if (stockEntryDetailIds.length > 0) {
        await this.repository.deleteLostEntriesByStockEntryDetailIds(
          stockEntryDetailIds,
          tx,
        );
      }

      // Deletar a transação (isso deletará automaticamente os stockEntryDetails devido ao onDelete: Cascade)
      const deletedTransaction = await this.repository.deleteTransaction(
        id,
        tx,
      );

      // Verificar se ainda há estoque disponível para cada produto após a exclusão
      if (productIds.length > 0) {
        await this.updateCatalogAvailabilityAfterDeletion(productIds, tx);
      }

      return deletedTransaction;
    });
  }

  async getInstallments() {
    return this.repository.findAllInstallments();
  }

  async getStockEntryDetails() {
    return this.repository.findAllStockEntryDetails();
  }

  async getInstallmentsByTransaction(id: string) {
    return this.repository.findAllInstallmentsByTransaction(id);
  }

  async updateInstallment(id: string, dto: UpdateInstallmentDto) {
    return this.repository.runInTransaction(async (tx) => {
      const installment = await this.repository.findUniqueInstallment(id, tx);

      if (!installment) {
        throw new NotFoundException('Parcela da transação não encontrada');
      }

      let paidDate: Date | null;

      // Se o DTO tem paidDate definido, usar esse valor
      if (dto.paidDate !== undefined) {
        paidDate = dto.paidDate ? new Date(dto.paidDate) : null;
      } else {
        // Se não tem paidDate no DTO, fazer toggle da parcela
        paidDate = installment.paidDate ? null : new Date();
      }

      const updatedInstallment = await this.repository.updateInstallment(
        id,
        { paidDate },
        tx,
      );

      const transactionId = updatedInstallment.stockTransactionId;

      const transaction = await this.repository.findUniqueTransaction(
        transactionId,
        tx,
      );

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      // Validar apenas se estamos marcando como pago (não para desmarcar)
      if (paidDate && paidDate < transaction.createdAt) {
        throw new BadRequestException(
          'A data de pagamento não pode ser anterior à data de criação da parcela/Transação.',
        );
      }

      // Buscar todas as parcelas da transação para verificar se todas estão pagas
      const allInstallments =
        await this.repository.findAllInstallmentsByTransaction(
          transactionId,
          tx,
        );

      // Verificar se todas as parcelas estão pagas (incluindo a que acabamos de atualizar)
      const allPaid = allInstallments.every((i) => {
        if (i.id === id) {
          return paidDate !== null;
        }
        return i.paidDate !== null;
      });

      // Atualizar status da transação
      if (allPaid) {
        await tx.stockTransaction.update({
          where: { id: transactionId },
          data: {
            statusCheckout: 'Concluded',
          },
        });
        console.log(`✅ Transaction ${transactionId} concluded!`);
      } else {
        // Se nem todas estão pagas, marcar como Pending
        await tx.stockTransaction.update({
          where: { id: transactionId },
          data: {
            statusCheckout: 'Pending',
          },
        });
        console.log(`🔄 Transaction ${transactionId} back to pending.`);
      }

      return updatedInstallment;
    });
  }

  // Corrige uma entrada de estoque (erro de digitação ou ajuste por contagem física)
  async updateStockEntryDetail(id: string, dto: UpdateStockEntryDetailDto) {
    return this.repository.runInTransaction(async (tx) => {
      const entry = await this.repository.findStockEntryDetailById(id, tx);

      if (!entry) {
        throw new NotFoundException('Entrada de estoque não encontrada');
      }

      const updated = await this.repository.updateStockEntryDetail(
        id,
        {
          ...(dto.quantityOnStock !== undefined && {
            quantityOnStock: dto.quantityOnStock,
          }),
          ...(dto.validityDate !== undefined && {
            validityDate: new Date(dto.validityDate),
          }),
        },
        tx,
      );

      const totalStock = await this.repository.getTotalStockByProductId(
        entry.productId,
        tx,
      );

      await this.catalogService.updateProductsAvailability(
        [entry.productId],
        totalStock > 0,
        tx,
      );

      return updated;
    });
  }

  private async updateCatalogAvailabilityAfterDeletion(
    productIds: string[],
    tx: any,
  ) {
    // Para cada produto, verificar se ainda há estoque disponível em outras transações
    for (const productId of productIds) {
      const remainingStock = await this.repository.getTotalStockByProductId(
        productId,
        tx,
      );

      // Se não há mais estoque disponível, marcar como indisponível no catalog
      if (remainingStock === 0) {
        await this.catalogService.updateProductsAvailability(
          [productId],
          false,
          tx,
        );
      }
      // Se ainda há estoque, manter como disponível (não fazer nada)
    }
  }
}
