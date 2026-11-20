import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export interface SiteSettings {
  id: number;
  storeOpen: boolean;
  autoScheduleEnabled: boolean;
  storeOverride: "ForceOpen" | "ForceClose" | null;
  overrideUntil: string | null;
  nightPriceEnabled: boolean;
  nightPriceStartHour: number;
  nightPriceEndHour: number;
  nightPriceMarkupPercent: number;
  ifoodMarkupPercent: number;
  freightPrice: number;
  deliveryEnabled: boolean;
  oneManArmyMode: boolean;
  city: string;
  state: string;
  creditCardFeePercent: number;
  debitCardFeePercent: number;
  pixFeePercent: number;
  defaultOnTheBillLimit: number;
  simplesNacionalEnabled: boolean;
  taxPercent: number;
  taxDeduction: number;
  updatedAt: string;
}

export interface UpdateSettingsDto {
  storeOpen?: boolean;
  autoScheduleEnabled?: boolean;
  nightPriceEnabled?: boolean;
  nightPriceStartHour?: number;
  nightPriceEndHour?: number;
  nightPriceMarkupPercent?: number;
  ifoodMarkupPercent?: number;
  freightPrice?: number;
  deliveryEnabled?: boolean;
  oneManArmyMode?: boolean;
  city?: string;
  state?: string;
  creditCardFeePercent?: number;
  debitCardFeePercent?: number;
  pixFeePercent?: number;
  defaultOnTheBillLimit?: number;
  simplesNacionalEnabled?: boolean;
  taxPercent?: number;
  taxDeduction?: number;
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

// ---------- Grade semanal de funcionamento ----------

export type StoreOverride = "ForceOpen" | "ForceClose";

export interface DaySchedule {
  weekday: number; // 0 = domingo ... 6 = sábado
  isOpen: boolean;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export interface StoreStatus {
  isOpen: boolean;
  autoScheduleEnabled: boolean;
  override: StoreOverride | null;
  overrideUntil: string | null;
  nextTransition: { at: string; opens: boolean } | null;
}

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const getSchedules = async (): Promise<DaySchedule[]> => {
  const response = await requestWithAuth(() => api.get("/settings/schedule"));
  return response.data;
};

export const updateSchedules = async (
  days: DaySchedule[],
): Promise<DaySchedule[]> => {
  const response = await requestWithAuth(() =>
    api.put("/settings/schedule", { days }),
  );
  return response.data;
};

export const getStoreStatus = async (): Promise<StoreStatus> => {
  const response = await requestWithAuth(() =>
    api.get("/settings/store-status"),
  );
  return response.data;
};

/** `mode` null devolve a loja ao automático. */
export const setStoreOverride = async (
  mode: StoreOverride | null,
): Promise<StoreStatus> => {
  const response = await requestWithAuth(() =>
    api.post("/settings/override", { mode }),
  );
  return response.data;
};

/** "HH:MM" a partir dos campos separados. */
export const formatScheduleTime = (hour: number, minute: number): string =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
