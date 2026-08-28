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
