import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";
import { SupplierProps } from "@/_types";

export const getSuppliers = async () => {
  return await requestWithAuth(async () => {
    const response = await api.get("/supplier");
    return response.data;
  });
};

export const createSupplier = async (
  supplierData: Omit<SupplierProps, "id">,
) => {
  return await requestWithAuth(async () => {
    const response = await api.post("/supplier", supplierData);
    return response.data;
  });
};

export const updateSupplier = async (
  id: string,
  supplierData: Omit<SupplierProps, "id">,
) => {
  return await requestWithAuth(async () => {
    const response = await api.put(`/supplier/${id}`, supplierData);
    return response.data;
  });
};

export const deleteSupplier = async (id: string) => {
  return await requestWithAuth(async () => {
    const response = await api.delete(`/supplier/${id}`);
    return response.data;
  });
};
