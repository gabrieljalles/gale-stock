import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";
import { id } from "date-fns/locale";
import { ProductProps } from "@/_types";

export const getProducts = async (): Promise<ProductProps[]> => {
  const response = await api.get("/products");
  return response.data;
};

export const createProduct = async (
  data: Omit<ProductProps, "id" | "createdAt" | "updatedAt">,
) => {
  const response = await requestWithAuth(() => api.post("/products", data));
  return response.data;
};

export const updateProduct = async (
  id: string,
  data: Partial<Omit<ProductProps, "id" | "createdAt" | "updatedAt">>,
) => {
  const response = await requestWithAuth(() =>
    api.patch(`/products/${id}`, data),
  );
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await requestWithAuth(() => api.delete(`/products/${id}`));
  return response.data;
};
