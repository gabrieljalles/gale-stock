import { api } from "./api";

// Rotas públicas da vitrine: não passam por requestWithAuth porque o
// visitante ainda não tem conta. O interceptor do axios anexa o token
// quando existe, mas o backend não exige.

export interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  size: string;
  sizeType: string;
  imgUrl: string;
  price: number;
  isLiquidation: boolean;
  // Promoção (DiscountCatalog) ainda não é enviada pelo backend — o selo
  // dourado no card já está pronto e acende sozinho quando esse campo
  // começar a vir. Até lá nenhum produto o exibe.
  isPromotion?: boolean;
  // Preço de atacado: null quando o produto não tem, ou está desativado.
  packageDiscountAmount: number | null;
  packagePrice: number | null;
  inStock: boolean;
  maxQuantity: number;
}

export interface PublicSettings {
  storeOpen: boolean;
  // Hora de fechamento só vem quando o fechamento automático está ligado.
  /** "HH:MM" da próxima virada de fechamento, ou null. */
  closesAt: string | null;
  deliveryEnabled: boolean;
  freightPrice: number;
  city: string;
  state: string;
}

export const getStorefrontCatalog = async (): Promise<StorefrontProduct[]> => {
  const response = await api.get("/catalog/storefront");
  return response.data;
};

export const getPublicSettings = async (): Promise<PublicSettings> => {
  const response = await api.get("/settings/public");
  return response.data;
};
