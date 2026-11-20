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

// Pedido feito pelo próprio cliente na vitrine. O servidor recalcula os
// preços — o que vai daqui é só o que o cliente escolheu.
export interface CreateCustomerOrderPayload {
  orderDetails: { productId: string; quantity: number }[];
  transactionType: string;
  // Pontos que o cliente escolheu usar como desconto. Quem valida saldo,
  // mínimo e teto percentual é o servidor, dentro da transação da venda.
  pointsToRedeem?: number;
  // Um endereço salvo na conta...
  userAddressId?: string;
  // ...ou um escrito na hora.
  orderAddress?: {
    typeAddress: string;
    address: string;
    number: string;
    district: string;
    complement?: string;
    zipCode?: string;
  };
}

export const createCustomerOrder = async (
  payload: CreateCustomerOrderPayload,
) => {
  const response = await requestWithAuth(() =>
    api.post("/order/customer", payload),
  );
  return response.data;
};

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

export interface SaleProduct {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unityPrice: number;
  totalPrice: number;
}

export interface SaleAddress {
  recipientName: string | null;
  typeAddress: string;
  address: string;
  number: string;
  district: string;
  complement: string | null;
  zipCode: string | null;
}

export interface Sale {
  id: string;
  createdAt: string;
  deliveryType: "InStore" | "Delivery";
  orderStatus: string;
  isPaid: boolean;
  paidDate: string | null;
  transactionType: string | null;
  workDayId: string | null;
  buyer: {
    clientId: string | null;
    name: string;
    isAnonymous: boolean;
  };
  deliveryMan: { id: string; fullName: string } | null;
  address: SaleAddress | null;
  products: SaleProduct[];
  totalProductPrice: number;
  freightPrice: number;
  interestAmount: number;
  /** Bruto cobrado do cliente. */
  totalPrice: number;
  /** Alíquota da maquininha congelada nesta venda. */
  feePercent: number;
  /** Quanto a operadora ficou. */
  feeAmount: number;
  /** O que de fato entra no caixa: totalPrice - feeAmount. */
  netPrice: number;
  /** Custo das mercadorias baixadas do estoque. */
  totalCost: number;
  /** netPrice - totalCost. */
  profit: number;
}

export const getAllSells = async (): Promise<Sale[]> => {
  const response = await requestWithAuth(() => api.get("/order/sells"));
  return response.data;
};

export interface UpdateSalePayload {
  transactionType?: string;
  clientId?: string | null;
  recipientName?: string;
  typeAddress?: string;
  address?: string;
  number?: string;
  district?: string;
  complement?: string;
  zipCode?: string;
  items?: { orderDetailId: string; quantity: number }[];
}

export const updateSale = async (id: string, payload: UpdateSalePayload) => {
  const response = await requestWithAuth(() =>
    api.patch(`/order/sells/${id}`, payload),
  );
  return response.data;
};

export type KanbanOrderStatus =
  | "Confirmed"
  | "Preparing"
  | "ReadyToPickup"
  | "OutForDelivery"
  | "Delivered";

export interface KanbanProduct {
  id: string;
  productName: string;
  quantity: number;
  checked: boolean;
}

export interface KanbanOrderAddress {
  address: string;
  number: string;
  district: string;
  complement: string | null;
  zipCode: string | null;
  // Preenchidas pelo geocoding; null quando o endereço não foi resolvido.
  latitude: number | null;
  longitude: number | null;
}

export interface KanbanOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderStatus: KanbanOrderStatus;
  orderSource: string | null;
  buyerName: string;
  address: KanbanOrderAddress | null;
  deliveryMan: { id: string; fullName: string } | null;
  products: KanbanProduct[];
}

/**
 * Pedidos do Kanban.
 *
 * `todayOnly` recorta só a coluna "Entregue" ao dia de trabalho aberto —
 * é o que o Resumo usa. As colunas ativas vêm sempre inteiras, senão um
 * pedido de ontem ainda em preparo sumiria do quadro.
 */
export const getKanbanOrders = async (
  todayOnly = false,
): Promise<KanbanOrder[]> => {
  const response = await requestWithAuth(() =>
    api.get("/order/kanban", {
      params: todayOnly ? { scope: "today" } : undefined,
    }),
  );
  return response.data;
};

export const startPreparing = async (orderId: string) => {
  const response = await requestWithAuth(() =>
    api.post(`/order/${orderId}/start-preparing`),
  );
  return response.data;
};

export const toggleChecklistItem = async (
  orderId: string,
  orderDetailId: string,
  checked: boolean,
) => {
  const response = await requestWithAuth(() =>
    api.patch(`/order/${orderId}/checklist`, { orderDetailId, checked }),
  );
  return response.data;
};

export const assignDriver = async (orderId: string, deliveryManId: string) => {
  const response = await requestWithAuth(() =>
    api.patch(`/order/${orderId}/assign-driver`, { deliveryManId }),
  );
  return response.data;
};

export const markDelivered = async (orderId: string) => {
  const response = await requestWithAuth(() =>
    api.post(`/order/${orderId}/deliver`),
  );
  return response.data;
};

export interface MapCenter {
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

export const getMapCenter = async (): Promise<MapCenter> => {
  const response = await requestWithAuth(() => api.get("/order/map-center"));
  return response.data;
};

export interface GeocodeResult {
  geocoded: number;
  failed: number;
  pending: number;
}

// Resolve as coordenadas dos pedidos ativos que ainda não têm. Como o
// serviço gratuito limita a 1 consulta por segundo, pode demorar alguns
// segundos quando há vários endereços novos.
// Com retryFailed, tenta de novo os endereços que já falharam antes —
// usado depois de corrigir um endereço errado.
export const geocodePendingOrders = async (
  retryFailed = false,
): Promise<GeocodeResult> => {
  const response = await requestWithAuth(() =>
    api.post(`/order/geocode${retryFailed ? "?retryFailed=true" : ""}`),
  );
  return response.data;
};

/** Cancela o pedido e devolve os produtos ao estoque. */
export const cancelOrder = async (
  orderId: string,
): Promise<{ cancelled: boolean; restockedLines: number }> => {
  const response = await requestWithAuth(() =>
    api.post(`/order/${orderId}/cancel`),
  );
  return response.data;
};

export const revertOrderStatus = async (orderId: string) => {
  const response = await requestWithAuth(() =>
    api.post(`/order/${orderId}/revert`),
  );
  return response.data;
};

// ---------- "Meus pedidos" (vitrine do cliente) ----------

export interface MyOrder {
  id: string;
  createdAt: string;
  deliveryType: "InStore" | "Delivery";
  orderStatus: string;
  isPaid: boolean;
  isOpen: boolean;
  isCancelled: boolean;
  deliveryManName: string | null;
  transactionType: string | null;
  address: {
    typeAddress: string;
    address: string;
    number: string;
    district: string;
  } | null;
  products: {
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
  }[];
  freightPrice: number;
  totalPrice: number;
}

export const getMyOrders = async (): Promise<MyOrder[]> => {
  const response = await requestWithAuth(() => api.get("/order/my-orders"));
  return response.data;
};

// ---------- Fila de pedidos do cliente ----------

export interface MyDeliveryStatus {
  openOrderCount: number;
  maxOpenOrders: number;
  canPlaceNewOrder: boolean;
  /** Pedido que ainda aceita itens novos (Recebido ou Em preparo). */
  editableOrder: {
    id: string;
    orderStatus: string;
    itemCount: number;
    totalPrice: number;
  } | null;
  /** Pedidos já montados ou a caminho — fora do alcance do cliente. */
  lockedOrders: { id: string; orderStatus: string }[];
}

export const getMyDeliveryStatus = async (): Promise<MyDeliveryStatus> => {
  const response = await requestWithAuth(() =>
    api.get("/order/my-delivery-status"),
  );
  return response.data;
};

export const addItemsToMyOrder = async (
  orderId: string,
  items: { productId: string; quantity: number }[],
): Promise<{ added: number; orderId: string }> => {
  const response = await requestWithAuth(() =>
    api.post(`/order/${orderId}/add-items`, { items }),
  );
  return response.data;
};
