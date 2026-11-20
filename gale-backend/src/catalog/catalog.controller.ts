import { Body, Controller, Get, Injectable, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/auth/roles.decorator";
import { Public } from "src/auth/public.decorator";

@Controller('catalog')
export class CatalogController{
    constructor(private readonly catalogService: CatalogService) {}

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin', 'Shopper')
    async findAll() {
        return this.catalogService.findAllWithProductsAndStock();
    }

    // Vitrine pública: qualquer visitante vê, então devolve só campos
    // seguros (ver findStorefrontCatalog).
    @Get('storefront')
    @Public()
    async findStorefront() {
        return this.catalogService.findStorefrontCatalog();
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin', 'Shopper')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCatalogDto,
    ) {
        return this.catalogService.updateCatalog(id, dto);
    }
}