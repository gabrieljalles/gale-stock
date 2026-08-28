import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export interface WorkDayReport {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string | null;
  closedBy: string | null;
  isOpen: boolean;
  orderCount: number;
  totalRevenue: number;
  totalFreightRevenue: number;
  totalInterestReceived: number;
  totalProfit: number;
  averageTicket: number;
  durationMinutes: number | null;
}

export interface TopProduct {
  productName: string;
  quantity: number;
}

export const getWorkDays = async (): Promise<WorkDayReport[]> => {
  const response = await requestWithAuth(() => api.get("/work-days"));
  return response.data;
};

export const getCurrentTopProducts = async (): Promise<TopProduct[]> => {
  const response = await requestWithAuth(() =>
    api.get("/work-days/current/top-products"),
  );
  return response.data;
};
