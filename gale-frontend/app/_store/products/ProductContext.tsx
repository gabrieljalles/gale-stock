"use client";
import { ProductProps } from "@/_types";
import { getProducts } from "@/api/product";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface ProductContextType {
  products: ProductProps[] | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  addProduct: (product: ProductProps) => void;
  removeProduct: (id: string) => void;
}

const ProductContext = createContext<ProductContextType>({
  products: null,
  loading: false,
  error: null,
  refresh: async () => {},
  addProduct: (p) => {},
  removeProduct: (id) => {},
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductProps[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const addProduct = (p: ProductProps) => {
    setProducts((prev) => (prev ? [p, ...prev] : [p]));
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : []));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        addProduct,
        removeProduct,
        error,
        refresh: fetch,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx)
    throw new Error("useProducts must be used within a ProductProvider");
  return ctx;
}
