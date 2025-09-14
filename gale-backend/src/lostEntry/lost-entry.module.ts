import { Module } from '@nestjs/common';
import { LostEntryController } from './lost-entry.controller';
import { LostEntryRepository } from './lost-entry.repository';
import { LostEntryService } from './lost-entry.service';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [LostEntryController],
  providers: [LostEntryRepository, LostEntryService],
})
export class LostEntryModule {}
