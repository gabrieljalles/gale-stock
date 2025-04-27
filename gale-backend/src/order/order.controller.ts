import { Body, Controller, Injectable, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { CreateFullOrderDto,  } from "./dto/create-order.dto";
import { OrderService } from "./order.service";


@Controller('order')
export class OrderController{

  constructor(private readonly service: OrderService) {}

    @Post('shopper')
      createOrderByShopper(@Body() body: CreateFullOrderDto) {
        return this.service.createOrderByShopper(body);
      }

}