"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { StorefrontProduct } from "@/api/storefront";

const STORAGE_KEY = "gale-cart";

export interface CartLine {
  product: StorefrontProduct;
  quantity: number;
}

interface CartContextData {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (product: StorefrontProduct, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  quantityOf: (productId: string) => number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

// O preço unitário depende da quantidade: a partir de packageDiscountAmount
// vale o preço de atacado. Mesma regra do backend (pricing.utils), pra
// vitrine e caixa não divergirem.
export const unitPriceFor = (
  product: StorefrontProduct,
  quantity: number,
): number => {
  if (
    product.packageDiscountAmount != null &&
    product.packagePrice != null &&
    quantity >= product.packageDiscountAmount
  ) {
    return product.packagePrice;
  }
  return product.price;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Carrinho sobrevive a recarregar a página e ao desvio pro login —
  // perder o carrinho na hora de entrar seria perder a venda.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {
      // Storage bloqueado ou conteúdo inválido: começa vazio.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Sem persistência o carrinho ainda funciona na sessão atual.
    }
  }, [lines, hydrated]);

  const addItem = useCallback((product: StorefrontProduct, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;

      // Nunca deixa passar do estoque disponível.
      const capped = Math.min(nextQuantity, product.maxQuantity);
      if (capped <= 0) return prev;

      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: capped, product }
            : line,
        );
      }
      return [...prev, { product, quantity: capped }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((line) =>
          line.product.id === productId
            ? {
                ...line,
                quantity: Math.min(quantity, line.product.maxQuantity),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.product.id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const quantityOf = useCallback(
    (productId: string) =>
      lines.find((line) => line.product.id === productId)?.quantity ?? 0,
    [lines],
  );

  const itemCount = useMemo(
    () => lines.reduce((total, line) => total + line.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (total, line) =>
          total + unitPriceFor(line.product, line.quantity) * line.quantity,
        0,
      ),
    [lines],
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        itemCount,
        subtotal,
        addItem,
        setQuantity,
        removeItem,
        clear,
        quantityOf,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
};
