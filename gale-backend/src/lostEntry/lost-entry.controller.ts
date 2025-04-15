import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LostEntryService } from './lost-entry.service';
import { CreateLostEntryDto } from './dto/create-lost-entry.dto';

@Controller('lost-entry')
export class LostEntryController {
  constructor(private readonly service: LostEntryService) {}

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteLoss(id);
  }

  @Post()
  create(@Body() body: CreateLostEntryDto) {
    return this.service.createLoss(body);
  }
}
