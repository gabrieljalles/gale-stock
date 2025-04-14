import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';
import { CatalogModule } from 'src/catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [ProductController],
  providers: [ProductRepository, ProductService],
})
export class ProductModule {}
