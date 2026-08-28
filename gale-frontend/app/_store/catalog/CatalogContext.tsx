import { CatalogItem, getCatalogItems, updateCatalogPrice, UpdateCatalogPriceDto } from "@/api/catalog";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CatalogContextData {
  catalogItems: CatalogItem[];
  loading: boolean;
  error: string | null;
  loadCatalogItems: () => Promise<void>;
  updateItemPrice: (id: string, data: UpdateCatalogPriceDto) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextData>({} as CatalogContextData);

interface CatalogProviderProps {
  children: ReactNode;
}

export const CatalogProvider = ({ children }: CatalogProviderProps) => {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getCatalogItems();
      setCatalogItems(items);
    } catch (err) {
      console.error("Erro ao carregar itens do catálogo:", err);
      setError("Erro ao carregar itens do catálogo");
    } finally {
      setLoading(false);
    }
  };

  const updateItemPrice = async (id: string, data: UpdateCatalogPriceDto) => {
    try {
      setError(null);
      const updatedItem = await updateCatalogPrice(id, data);
      
      setCatalogItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, ...updatedItem, updatedAt: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar preço:", err);
      setError("Erro ao atualizar preço");
      throw err;
    }
  };

  useEffect(() => {
    loadCatalogItems();
  }, []);

  return (
    <CatalogContext.Provider
      value={{
        catalogItems,
        loading,
        error,
        loadCatalogItems,
        updateItemPrice,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog deve ser usado dentro de CatalogProvider");
  }
  return context;
};