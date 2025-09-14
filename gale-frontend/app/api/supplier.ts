import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export const getSuppliers = async () => {
  return await requestWithAuth(async () => {
    const response = await api.get("/supplier");
    return response.data;
  });
};
