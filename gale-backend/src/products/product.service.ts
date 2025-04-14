import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { Product } from '@prisma/client';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { CreateProductDto } from './dto/create-product.dto';
import { CatalogService } from 'src/catalog/catalog.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly catalogService: CatalogService
  ) {}

  async create(data: CreateProductDto): Promise<Product> {
    return this.repository.runInTransaction(async (tx) => {
      const product = await this.repository.create(data,tx);
      await this.catalogService.createCatalogForProduct(product.id, tx);
      return product
    })
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

  async delete(id: string): Promise<{ message: string }> {
    await this.findById(id);

    await this.repository.delete(id);

    return { message: 'Produto apagado com sucesso!' };
  }
}
