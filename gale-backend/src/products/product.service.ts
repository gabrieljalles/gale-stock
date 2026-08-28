import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { Prisma, Product } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CatalogService } from '../catalog/catalog.service';

const DUPLICATE_FIELD_MESSAGES: Record<string, string> = {
  name: 'Já existe um produto cadastrado com esse nome.',
  barCode: 'Já existe um produto cadastrado com esse código de barras.',
};

@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly catalogService: CatalogService,
  ) {}

  async create(data: CreateProductDto): Promise<Product> {
    try {
      return await this.repository.runInTransaction(async (tx) => {
        const { consumerPrice, ...productData } = data;
        const product = await this.repository.create(productData, tx);

        // Só criar catalog se consumerPrice foi fornecido
        if (consumerPrice) {
          await this.catalogService.createCatalogForProduct(
            product.id,
            consumerPrice,
            tx,
          );
        }

        return product;
      });
    } catch (error) {
      throw this.translateDuplicateError(error);
    }
  }

  async findAll(): Promise<Product[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new NotFoundException('Produto não encontrado!');
    }

    return product;
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    await this.findById(id);

    try {
      return await this.repository.update(id, data);
    } catch (error) {
      throw this.translateDuplicateError(error);
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    await this.findById(id);

    try {
      await this.repository.delete(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Não é possível excluir esse produto pois ele já possui histórico de estoque, vendas ou perdas vinculado.',
        );
      }
      throw error;
    }

    return { message: 'Produto apagado com sucesso!' };
  }

  private translateDuplicateError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = (error.meta?.target as string[] | string) ?? [];
      const fields = Array.isArray(target) ? target : [target];
      const field = fields.find((f) => DUPLICATE_FIELD_MESSAGES[f]);

      return new ConflictException(
        field
          ? DUPLICATE_FIELD_MESSAGES[field]
          : 'Já existe um produto cadastrado com esses dados.',
      );
    }

    return error;
  }
}
