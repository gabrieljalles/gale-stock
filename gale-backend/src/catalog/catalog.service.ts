import { Injectable } from "@nestjs/common";
import { CatalogRepository } from "./catalog.repository";
import { Prisma } from "@prisma/client";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async findProductById(productId: string, tx?: Prisma.TransactionClient){
    return await this.repository.findById(productId, tx);
  }

  async findManyProductsByIds(productIds: string[], tx?: Prisma.TransactionClient){
    return await this.repository.findManyById(productIds, tx);
  }

  async createCatalogForProduct(productId: string, consumerPrice?: Prisma.Decimal, tx?: Prisma.TransactionClient){
    return await this.repository.create(productId, consumerPrice, tx);
  }

  //Precisa criar um multiplicador para nightPrice
  async updateCatalog(id: string, data: UpdateCatalogDto){
    return await this.repository.update(id, data);
  }

  //Função que aumenta ou diminui a quantidade de produto em catalog.
  async adjustStock(
    catalogId: string,
    data: UpdateCatalogDto,
    operation: 'increment' | 'decrement',
    tx?: Prisma.TransactionClient
  ){
    const catalog = await this.repository.findById(catalogId, tx);

    if(!catalog){
      throw new Error(`Produto com ID ${catalogId} não encontrado.`);
    }

    if( data.stock === undefined){
      throw new Error('Quantidade deve ser informada para ajustar estoque.')
    }

    if(data.stock < 0){
      throw new Error("Quantidade não pode ser negativa.");
    }

    let newStock = catalog.stock;

    if(operation === 'increment'){
      newStock += data.stock;
    } else if (operation === 'decrement'){
      if (catalog.stock < data.stock){
        throw new Error(`Estoque insuficiente para o produto ${catalogId}. Atual: ${catalog.stock}, Tentando remover: ${data.stock}`);
      }
      newStock -= data.stock;
    }
    return await this.repository.update(catalogId, {stock: newStock }, tx);
  }
  
}