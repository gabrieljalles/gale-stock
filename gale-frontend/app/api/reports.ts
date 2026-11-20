import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export interface MarginTrendPoint {
  date: string;
  marginPercent: number;
}

export interface ProductMarginPoint {
  date: string;
  totalPrice: number;
  totalCost: number;
  marginPercent: number;
}

export const getMarginTrend = async (
  days: number,
): Promise<MarginTrendPoint[]> => {
  const response = await requestWithAuth(() =>
    api.get("/reports/margin-trend", { params: { days } }),
  );
  return response.data;
};

export const getProductMarginTrend = async (
  productId: string,
  days: number,
): Promise<ProductMarginPoint[]> => {
  const response = await requestWithAuth(() =>
    api.get("/reports/product-margin", { params: { productId, days } }),
  );
  return response.data;
};

export interface PaymentMethodSlice {
  transactionType: string;
  /** Bruto vendido nessa forma de pagamento. */
  total: number;
  /** Quanto a operadora ficou. */
  fee: number;
  /** total - fee. */
  net: number;
  orderCount: number;
}

/** Acumulado da loja, por forma de pagamento (Dashboard). */
export const getSalesByPaymentMethod = async (): Promise<
  PaymentMethodSlice[]
> => {
  const response = await requestWithAuth(() =>
    api.get("/reports/payment-methods"),
  );
  return response.data;
};

/** Mesma quebra, só do dia de trabalho em aberto (Resumo). */
export const getTodaySalesByPaymentMethod = async (): Promise<
  PaymentMethodSlice[]
> => {
  const response = await requestWithAuth(() =>
    api.get("/reports/payment-methods/today"),
  );
  return response.data;
};
