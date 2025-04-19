import { Injectable } from "@nestjs/common";
import { OrderRequestRepository } from "./order.repository";
import { CatalogService } from "src/catalog/catalog.service";
import { CreateFullOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrderRequestService{
    constructor(
        private readonly repository: OrderRequestRepository,
        private readonly catalogService: CatalogService
    ){}

    async createOrder(dto: CreateFullOrderDto){
        const {orderRequest, orderDetails, orderTransaction, ...rest} = dto;
        
        return this.repository.runInTransaction(async (tx)=> {
        
            try{
                const orderRequestCreated = await this.repository.createOrderRequest(
                    {
                        orderSource: orderRequest.orderSource,
                        deliveryType: orderRequest.deliveryType,
                        orderStatus: orderRequest.orderStatus,
                        ...(orderRequest.clientId && {
                            user: {
                                connect: { id: orderRequest.clientId},
                            },
                        }),
                        ...(orderRequest.deliveryManId && {
                            user: {
                                connect: {id : orderRequest.deliveryManId },
                            }
                        }),
                        ...(orderRequest.addressId && {
                            userAddress: {
                                connect: {id: orderRequest.addressId},
                            }
                        }),
                    },
                    tx
                );
                console.log('✅ Created orderRequest.');
                return orderRequestCreated;
            }catch(err){
                console.error('❌ Error creating orderRequest:', err);
                throw err;
            }
        })
    }

    
}