import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from '@prisma/client';


@Injectable()
export class SupplierService {
  [x: string]: any;

  constructor(private readonly repository: SupplierRepository) {}

  async create(data: CreateSupplierDto): Promise<Supplier> {

    return this.repository.create(data);
  }

  async findAll(): Promise<Supplier[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Supplier | null> {
    const supplier = await this.repository.findById(id);

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado!');
    }

    return supplier;
  }

  async delete(id: string): Promise<{ message: string }> {
    await this.findById(id);

    await this.repository.delete(id);

    return { message: 'Fornecedor apagado com sucesso!' };
  }
}
