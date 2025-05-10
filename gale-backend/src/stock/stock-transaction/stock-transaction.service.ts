import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStockTransactionDto } from './dto/create-transaction.dto';
import { StockTransactionRepository } from './stock-transaction.repository';
import { UpdateInstallmentDto } from './dto/update-transaction.dto';
import { CatalogService } from 'src/catalog/catalog.service';
import { getLandedUnitCost } from '../../utils/landedunitCost.utils';

@Injectable()
export class StockTransactionService {
  constructor(
    private readonly repository: StockTransactionRepository,
    private readonly catalogService: CatalogService,
  ) {}

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

          await this.repository.createStockEntryDetails(
            stockEntryDetail.map((p) => ({
              stockTransactionId: transaction.id,
              productId: p.productId,
              baseUnitCost: p.baseUnitCost,
              initialQuantity: p.initialQuantity,
              quantityOnStock: p.initialQuantity,
              validityDate: new Date(p.validityDate),
              totalProductCost: p.totalProductCost,
              landedUnitCost: getLandedUnitCost(p, {
                ...dto,
              }),
            })),
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

      return this.repository.deleteTransaction(id, tx);
    });
  }

  async updateInstallment(id: string, dto: UpdateInstallmentDto) {
    const paidDate = dto.paidDate ? new Date(dto.paidDate) : undefined;

    return this.repository.runInTransaction(async (tx) => {
      const installment = await this.repository.findUniqueInstallment(id, tx);

      if (!installment) {
        throw new NotFoundException('Parcela da transação não encontrada');
      }

      const updatedInstallment = this.repository.updateInstallment(
        id,
        { paidDate },
        tx,
      );

      const transactionId = (await updatedInstallment).stockTransactionId;

      const transaction = await this.repository.findUniqueTransaction(
        transactionId,
        tx,
      );

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      if (paidDate && paidDate < transaction.createdAt) {
        throw new BadRequestException(
          'A data de pagamento não pode ser anterior à data de criação da parcela/Transação.',
        );
      }

      const allInstallments =
        await this.repository.findAllInstallmentsByTransaction(
          transactionId,
          tx,
        );

      const allPaid = allInstallments.every((i) => i.paidDate !== null);

      if (allPaid) {
        await tx.stockTransaction.update({
          where: { id: transactionId },
          data: {
            statusCheckout: 'Concluded',
          },
        });
        console.log(`✅ Transaction ${transactionId} concluded!`);
      }
      return updatedInstallment;
    });
  }
}
