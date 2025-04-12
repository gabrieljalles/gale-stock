import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierRepository } from './supplier.repository';
import { SupplierService } from './supplier.service';


@Module({
  controllers: [SupplierController],
  providers: [SupplierRepository, SupplierService],
})
export class SupplierModule {}
