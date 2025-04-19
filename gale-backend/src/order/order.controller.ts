import { Body, Controller, Injectable, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";
import { CreateOrderRequestDto } from "./dto/create-order.dto";


@Controller('order-request')
export class OrderController{

    @Post()
      create(@Body() body: CreateOrderRequestDto) {
        return this.OrderRequestService.create(body);
      }


}