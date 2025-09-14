import { CreateLostEntryDto, LostEntryProps } from "@/_types";
import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

const LOST_ENTRY_ENDPOINT = "/lost-entry";

//Busca todas as perdas de produtos
export const getLostEntries = async (): Promise<LostEntryProps[]> => {
  const response = await requestWithAuth(() => api.get(LOST_ENTRY_ENDPOINT));
  return response.data;
};

//Cria uma nova perda de produto
export const createLostEntry = async (data: CreateLostEntryDto) => {
  const response = await requestWithAuth(() =>
    api.post(LOST_ENTRY_ENDPOINT, data),
  );
  return response.data;
};

//Deleta uma perda de produto
export const deleteLostEntry = async (lostEntryId: string) => {
  const response = await requestWithAuth(() =>
    api.delete(`${LOST_ENTRY_ENDPOINT}/${lostEntryId}`),
  );
  return response.data;
};
