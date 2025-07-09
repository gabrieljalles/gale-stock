import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CreateSupplierDto } from 'src/supplier/dto/create-supplier.dto';
import { SupplierService } from 'src/supplier/supplier.service';

async function seedSuppliers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supplierService = app.get(SupplierService);

  const suppliers: CreateSupplierDto[] = [
    {
      legalRepresentative: '',
      enterprise: 'Atacadista SubZero',
      completeAddress: 'Av Aldo Borges Leão, 3071 - Uberlândia - MG',
      cellphone: '(34) 98427-2829',
      appName: 'Whatsapp',
      city: 'Uberlândia',
      email: '',
      imgUrl:
        'https://bfu8xmr6kg.ufs.sh/f/oK9fzCAtRnIf63lavMjuY7pk0n8hcUdBwRW41Gvrq6eZQEjF',
    },
    {
      legalRepresentative: 'Monique',
      enterprise: 'Ambev',
      completeAddress: '',
      cellphone: '(34) 3499317-0165',
      appName: 'Whatsapp',
      city: 'Ituiutaba',
      email: '',
      imgUrl:
        'https://bfu8xmr6kg.ufs.sh/f/oK9fzCAtRnIfIMSOfHpI62QXE87mYUTWOMFwRD0yruo3PtaG',
    },
  ];

  for (const supplier of suppliers) {
    await supplierService.create(supplier);
    console.log(`✅ Fornecedor criado: ${supplier.enterprise}`);
  }

  await app.close();
  console.log('Seed de fornecedores concluído com sucesso!');
}

seedSuppliers().catch((e) => {
  console.error(e);
  process.exit(1);
});
