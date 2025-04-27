import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderRepository } from "./order.repository";
import { CatalogService } from "src/catalog/catalog.service";
import { CreateFullOrderDto, CreateOrderDto } from "./dto/create-order.dto";
import { UserService } from "src/user/user.service";
import { NotFoundError } from "rxjs";
import { DeliveryType, OrderSource, OrderStatus, Prisma, TransactionType } from "@prisma/client";
import { getUnitPrice } from "src/utils/pricing.utils";

@Injectable()
export class OrderService{
    constructor(
        private readonly repository: OrderRepository,
        private readonly catalogService: CatalogService,
        private readonly userService: UserService
    ){}

    async createOrderByShopper(dto: CreateFullOrderDto){
        const {order, orderDetails, orderTransaction, orderAddress} = dto;
        const now = new Date();
        const hour = now.getHours();

        //Variáveis sem dinamismo;
        const isNight = hour >= 23 || hour < 7;
        const freightValue = 5;

        //Separiting ids
        const clientId = order.clientId?.trim();
        const userAddressId = order.userAddressId?.trim();
        const deliveryManId = order.deliveryManId?.trim();
        const transactionType = orderTransaction?.transactionType?.trim();
        const productsIds = orderDetails.map(d => d.productId);

        //checking the ids
        const address = userAddressId ? await this.userService.findAddressByAddressId(userAddressId): null;
        const client = clientId ? await this.userService.findUserById(clientId): null;
        const products = await this.catalogService.findManyProductsByIds(productsIds);

        //on the bill payment
        if(transactionType === TransactionType.OnTheBill){
            if (!client){
                throw new NotFoundException(
                    `Cliente precisa estar atríbuido para esse tipo de pagamento.`
                )
            }

            if(!client.canPayOnTheBill){
                throw new ForbiddenException(
                    `Cliente ${client.fullName} não está autorizado a pegar fiado.`
                  );
            }
        }

        return this.repository.runInTransaction(async (tx)=> {
            let orderCreated;
            let freightPrice;
            let totalProductPrice: Prisma.Decimal = new Prisma.Decimal(0);
            let isPaid;
            let paidDate;

            //Create an Order
            try{
                switch(order.deliveryType) {

                    case DeliveryType.InStore:
                        order.orderSource = OrderSource.Local;
                        freightPrice = 0;
                        if(transactionType && transactionType !== TransactionType.OnTheBill){
                            order.orderStatus = OrderStatus.Concluded;
                            isPaid = true;
                            paidDate = now;
                        }else{
                            order.orderStatus = OrderStatus.PickedUp;
                            if(!client){
                                throw new NotFoundException(`Cliente precisa estar atribuído para pagamento posterior ao consumo.`);
                            }
                        }
                        break;

                    case DeliveryType.Delivery:
                        order.orderStatus = OrderStatus.Confirmed;
                        freightPrice = freightValue;
                        break;
                }

                let clientConnect: { connect: { id: string } } | undefined;
                if (clientId) {
                    await this.userService.findUserById(clientId);    
                    clientConnect = { connect: { id: clientId } };
                }

                let deliveryManConnect: { connect: { id: string } } | undefined;
                if (deliveryManId) {
                    await this.userService.ensureDeliveryMan(deliveryManId);
                    deliveryManConnect = { connect: { id: deliveryManId } };
                }

                const orderPayload: Prisma.OrderCreateInput = {
                    deliveryType: order.deliveryType,
                    orderSource:  order.orderSource!,
                    orderStatus:  order.orderStatus,
                    ...(clientConnect     && { client:      clientConnect     }),
                    ...(deliveryManConnect && { deliveryMan: deliveryManConnect }),
                };

                orderCreated = await this.repository.createOrder(orderPayload, tx);
                console.log('✅ Created an order.');
            }catch(err){
                console.error('❌ Error creating an order:', err);
                throw err;
            }

            //Insert Order details
            try{
                const detailsWithPrices = orderDetails.map (item => {
                
                    const product = products.find(p => p.id === item.productId);
    
                    if(!product){
                        throw new NotFoundException(`Produto com ${item.productId} não encontrado.`);
                    }
    
                    if(product.consumerPrice == null){
                        throw new NotFoundException(`Preço não definido para o produto ${item.productId}`);
                    }

                    const isIfoodSource = order.orderSource === OrderSource.Ifood; 

                    const unityPrice = getUnitPrice(product, item.quantity, isNight, isIfoodSource);
                    const totalPrice = unityPrice.mul(item.quantity);
                    
                    return {
                        order: { connect: {id: orderCreated.id}},
                        catalog: {connect: { id: item.productId}},
                        quantity: item.quantity,
                        unityPrice,
                        totalPrice,
                    }
                
                });

                for (const detail of detailsWithPrices){
                    await this.repository.createOrderDetails(detail, tx);
                    totalProductPrice = totalProductPrice.add(detail.totalPrice);
                }

                console.log('✅ Created orderDetails.');
            }catch(err){
                console.error('❌ Error creating orderDetails:', err);
                throw err;
            }

            //Insert Order Transaction
            try{
                const totalPrice = totalProductPrice.add(freightPrice)

                const transactionPayload = {
                    order: { connect: {id: orderCreated.id}},
                    transactionType: transactionType as TransactionType,
                    totalProductPrice,
                    freightPrice,
                    totalPrice,
                    isPaid,
                    paidDate,
                }

                await this.repository.createOrderTransaction(transactionPayload, tx);
                
                console.log('✅ Created orderTransaction.');
            }catch(err){
                console.error('❌ Error creating orderTransaction:', err);
                throw err;
            }

            //Insert Order Address
            if(orderCreated.deliveryType === DeliveryType.Delivery){

                if (!address && !orderAddress) {
                    throw new BadRequestException(
                      'É preciso informar um endereço para entrega.'
                    );
                }

                try{
                    const addressPayload: Prisma.OrderAddressCreateInput = {
                        order: { connect: { id: orderCreated.id } },
                        typeAddress: address?.typeAddress  ?? orderAddress!.typeAddress!,
                        address:     address?.address      ?? orderAddress!.address!,
                        number:      address?.number       ?? orderAddress!.number!,
                        district:    address?.district     ?? orderAddress!.district!,
                        complement:  address?.complement    ?? orderAddress?.complement,
                        zipCode:     address?.zipCode       ?? orderAddress?.zipCode,
                    };
    
                    await this.repository.createOrderAddress(addressPayload,tx);
                    console.log('✅ Created orderAddress');
                }catch(err){
                    console.error('❌ Error creating orderAddress', err);
                    throw err;
                }
            }
        })

    }
}