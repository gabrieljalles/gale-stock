import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export interface ClientForTab {
  id: string;
  fullName: string;
  canPayOnTheBill: boolean;
}

export const getClientsForTab = async (): Promise<ClientForTab[]> => {
  const response = await requestWithAuth(() =>
    api.get("/user/clients-for-tab"),
  );
  return response.data;
};

export const getAllClients = async (): Promise<ClientForTab[]> => {
  const response = await requestWithAuth(() => api.get("/user/clients"));
  return response.data;
};

// ---- Conta do cliente (vitrine) ----

export interface MyProfile {
  id: string;
  fullName: string;
  email: string;
  cellPhone: string;
  accountType: string | null;
  avatarUrl: string | null;
  // Decide se "Notinha" aparece como forma de pagamento no checkout.
  canPayOnTheBill: boolean;
  /** Teto de notinha — próprio do cliente ou herdado da loja. */
  onTheBillLimit: number;
  /** Quanto já está em aberto. */
  onTheBillUsed: number;
  /** limite − usado, nunca negativo. */
  onTheBillAvailable: number;
}

// null remove a foto e volta pras iniciais.
export const updateMyAvatar = async (
  avatarUrl: string | null,
): Promise<MyProfile> => {
  const response = await requestWithAuth(() =>
    api.patch("/user/me/avatar", { avatarUrl }),
  );
  return response.data;
};

export interface MyAddress {
  id: string;
  typeAddress: string;
  address: string;
  number: string;
  complement: string | null;
  district: string;
  zipCode: string | null;
  isPrimary: boolean;
}

export interface CreateAddressPayload {
  typeAddress: string;
  address: string;
  number: string;
  district: string;
  complement?: string;
  zipCode?: string;
}

export const getMyProfile = async (): Promise<MyProfile> => {
  const response = await requestWithAuth(() => api.get("/user/me"));
  return response.data;
};

export const getMyAddresses = async (): Promise<MyAddress[]> => {
  const response = await requestWithAuth(() => api.get("/user/me/addresses"));
  return response.data;
};

export const createMyAddress = async (payload: CreateAddressPayload) => {
  const response = await requestWithAuth(() =>
    api.post("/user/me/address", payload),
  );
  return response.data;
};

export const deleteMyAddress = async (addressId: string) => {
  const response = await requestWithAuth(() =>
    api.delete(`/user/me/addresses/${addressId}`),
  );
  return response.data;
};

export const setMyPrimaryAddress = async (addressId: string) => {
  const response = await requestWithAuth(() =>
    api.patch(`/user/me/addresses/${addressId}/primary`),
  );
  return response.data;
};

export interface DeliveryMan {
  id: string;
  fullName: string;
  accountType: string;
}

export const getDeliveryMen = async (): Promise<DeliveryMan[]> => {
  const response = await requestWithAuth(() => api.get("/user/delivery-men"));
  return response.data;
};

export interface UserAddress {
  id: string;
  typeAddress: string;
  address: string;
  number: string;
  district: string;
  complement?: string;
  zipCode?: string;
  isPrimary: boolean;
}

export interface UserWithStats {
  id: string;
  fullName: string;
  cellPhone: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  cpfCNPJ: string;
  accountType: string | null;
  avatarUrl?: string;
  verifiedEmail: boolean;
  canPayOnTheBill: boolean;
  createdAt: string;
  address: UserAddress[];
  orderCount: number;
  totalRevenue: number;
  favoriteProduct: string | null;
  favoriteProductQuantity: number;
}

export const getAllUsersWithStats = async (): Promise<UserWithStats[]> => {
  const response = await requestWithAuth(() => api.get("/user/admin-list"));
  return response.data;
};

export const promoteUser = async (
  userId: string,
  accountType: string,
  password: string,
) => {
  const response = await requestWithAuth(() =>
    api.patch(`/user/${userId}/account-type`, { accountType, password }),
  );
  return response.data;
};

// ---------- Notinha: autorizacao e limite ----------

export interface OnTheBillCredit {
  canPayOnTheBill: boolean;
  /** Teto em reais - proprio do cliente ou herdado da loja. */
  onTheBillLimit: number;
  /** Quanto ja esta em aberto. */
  onTheBillUsed: number;
  /** limite - usado, nunca negativo. */
  onTheBillAvailable: number;
  /** false = esta herdando o padrao da loja. */
  hasCustomLimit: boolean;
}

/** Enderecos salvos de um cliente - usado pela "Nova Venda". */
export const getClientAddresses = async (
  clientId: string,
): Promise<MyAddress[]> => {
  const response = await requestWithAuth(() =>
    api.get(`/user/${clientId}/addresses`),
  );
  return response.data;
};

export const getOnTheBill = async (
  userId: string,
): Promise<OnTheBillCredit> => {
  const response = await requestWithAuth(() =>
    api.get(`/user/${userId}/on-the-bill`),
  );
  return response.data;
};

export const updateOnTheBill = async (
  userId: string,
  payload: { canPayOnTheBill: boolean; onTheBillLimit: number | null },
): Promise<OnTheBillCredit> => {
  const response = await requestWithAuth(() =>
    api.patch(`/user/${userId}/on-the-bill`, payload),
  );
  return response.data;
};
