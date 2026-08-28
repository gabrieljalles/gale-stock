import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export interface SiteSettings {
  id: number;
  storeOpen: boolean;
  autoCloseEnabled: boolean;
  storeCloseHour: number;
  nightPriceEnabled: boolean;
  nightPriceStartHour: number;
  nightPriceEndHour: number;
  nightPriceMarkupPercent: number;
  ifoodMarkupPercent: number;
  freightPrice: number;
  deliveryEnabled: boolean;
  creditCardFeePercent: number;
  debitCardFeePercent: number;
  pixFeePercent: number;
  updatedAt: string;
}

export interface UpdateSettingsDto {
  storeOpen?: boolean;
  autoCloseEnabled?: boolean;
  storeCloseHour?: number;
  nightPriceEnabled?: boolean;
  nightPriceStartHour?: number;
  nightPriceEndHour?: number;
  nightPriceMarkupPercent?: number;
  ifoodMarkupPercent?: number;
  freightPrice?: number;
  deliveryEnabled?: boolean;
  creditCardFeePercent?: number;
  debitCardFeePercent?: number;
  pixFeePercent?: number;
}

export const getSettings = async (): Promise<SiteSettings> => {
  const response = await requestWithAuth(() => api.get("/settings"));
  return response.data;
};

export const updateSettings = async (
  data: UpdateSettingsDto,
): Promise<SiteSettings> => {
  const response = await requestWithAuth(() => api.patch("/settings", data));
  return response.data;
};
