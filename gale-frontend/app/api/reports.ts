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
