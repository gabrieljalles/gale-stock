import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { Product } from '@prisma/client';

@Injectable()
export class ProductService {
  [x: string]: any;
  constructor(private readonly repository: ProductRepository) {}

  async create(data): Promise<Product> {}
}
