import { api } from "./api";

export interface SupplierData {
  id: string;
  legalRepresentative: string;
  enterprise: string;
  completeAddress: string;
  cellphone: string;
  appName: string;
  city: string;
  email: string;
  imgUrl: string;
}

export const getSuppliers = async () => {
  const response = await api.get("/supplier");
  return response.data;
};
