import { Body, Controller, Injectable, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";

@Controller('catalog')
export class CatalogController{
    constructor(private readonly catalogService: CatalogService) {}

    @Patch(':id')
    async update(
    @Param('id') id: string,
    @Body() dto: UpdateCatalogDto,
  ) {
    return this.catalogService.updateCatalog(id, dto);
  }
}