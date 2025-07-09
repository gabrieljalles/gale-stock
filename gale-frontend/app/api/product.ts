import { CategoryType, SizeType } from "@/_constants/product";
import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";
import { id } from "date-fns/locale";

export interface ProductProps {
  id: string;
  name: string;
  barCode?: string;
  description?: string;
  category: CategoryType;
  sizeType: SizeType;
  pack: number;
  size: string;
  imgUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getProducts = async (): Promise<ProductProps[]> => {
  const response = await api.get("/products");
  return response.data;
};

export const createProduct = async (
  data: Omit<ProductProps, "id" | "createdAt" | "updatedAt">,
) => {
  const response = await api.post("/products", data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await requestWithAuth(() => api.delete(`/products/${id}`));
  return response.data;
}