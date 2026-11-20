import { api } from "./api";
import { requestWithAuth } from "./auth";

export interface CatalogItem {
  id: string;
  consumerPrice?: number;
  consumerNightPrice?: number;
  consumerIfoodPrice?: number;
  discountPackPrice?: number;
  liquidationPrice?: number;
  isLiquidation: boolean;
  packageDiscountAmount?: number;
  wholesaleEnabled: boolean;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    barCode?: string;
    description: string;
    category: string;
    pack: number;
    sizeType: string;
    size: string;
    imgUrl?: string;
  };
  // Quantidade total em estoque (vem do agregado de StockEntryDetail)
  totalStock?: number;
  // Custo (landedUnitCost) do lote de estoque comprado mais recentemente
  lastPurchaseCost?: number;
}

export interface UpdateCatalogPriceDto {
  consumerPrice?: number;
  consumerNightPrice?: number;
  consumerIfoodPrice?: number;
  isLiquidation?: boolean;
  liquidationPrice?: number;
  packageDiscountAmount?: number;
  discountPackPrice?: number;
  wholesaleEnabled?: boolean;
  available?: boolean;
}

export const getCatalogItems = async (): Promise<CatalogItem[]> => {
  return await requestWithAuth(async () => {
    const response = await api.get('/catalog');
    
    // Calcular o estoque total e o custo da última compra para cada item
    // (stockEntries já vem ordenado do mais recente para o mais antigo).
    const itemsWithStock = response.data.map((item: any) => ({
      ...item,
      totalStock: item.product.stockEntries.reduce(
        (total: number, entry: any) => total + entry.quantityOnStock,
        0
      ),
      lastPurchaseCost: item.product.stockEntries[0]
        ? Number(item.product.stockEntries[0].landedUnitCost)
        : undefined,
    }));
    
    return itemsWithStock;
  });
};

export const updateCatalogPrice = async (id: string, data: UpdateCatalogPriceDto) => {
  return await requestWithAuth(async () => {
    const response = await api.patch(`/catalog/${id}`, data);
    return response.data;
  });
};