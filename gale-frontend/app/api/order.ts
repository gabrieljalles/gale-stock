import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export interface CreateOrderPayload {
  order: {
    deliveryType: "InStore" | "Delivery";
    orderSource?: string;
    clientId?: string;
    deliveryManId?: string;
    userAddressId?: string;
  };
  orderDetails: { productId: string; quantity: number }[];
  orderTransaction: {
    transactionType?: string;
  };
  orderAddress?: {
    recipientName?: string;
    typeAddress?: string;
    address?: string;
    number?: string;
    district?: string;
    complement?: string;
    zipCode?: string;
  };
}

export interface OpenTabProduct {
  productName: string;
  quantity: number;
  unityPrice: number;
  totalPrice: number;
}

export interface OpenTabOrder {
  orderId: string;
  createdAt: string;
  total: number;
  products: OpenTabProduct[];
}

export interface OpenTab {
  clientId: string;
  clientName: string;
  total: number;
  orders: OpenTabOrder[];
}

export const createOrder = async (data: CreateOrderPayload) => {
  const response = await requestWithAuth(() =>
    api.post("/order/shopper", data),
  );
  return response.data;
};

export const getOpenTabs = async (): Promise<OpenTab[]> => {
  const response = await requestWithAuth(() => api.get("/order/open-tabs"));
  return response.data;
};

export const closeTab = async (
  clientId: string,
  transactionType: string,
  interestAmount?: number,
) => {
  const response = await requestWithAuth(() =>
    api.post("/order/close-tab", {
      clientId,
      transactionType,
      ...(interestAmount != null && { interestAmount }),
    }),
  );
  return response.data;
};
