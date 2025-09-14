import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LostEntryService } from './lost-entry.service';
import { CreateLostEntryDto } from './dto/create-lost-entry.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('lost-entry')
export class LostEntryController {
  constructor(private readonly service: LostEntryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  findAll() {
    return this.service.findAllLosses();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  delete(@Param('id') id: string) {
    return this.service.deleteLoss(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  create(@Body() body: CreateLostEntryDto) {
    return this.service.registerLoss(body);
  }
}
