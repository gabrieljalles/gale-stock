"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getProducts } from "@/api/product";
import { getStockEntryDetails } from "@/api/stock";

interface ExpiredProduct {
  productId: string;
  productName: string;
  quantity: number;
}

const ExpiredProductsWarning = () => {
  const [expired, setExpired] = useState<ExpiredProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getStockEntryDetails()])
      .then(([products, stockDetails]) => {
        const productsMap = new Map(products.map((p) => [p.id, p]));
        const byProduct = new Map<string, ExpiredProduct>();
        const now = new Date();

        (stockDetails as any[]).forEach((entry) => {
          if (!entry.quantityOnStock || !entry.validityDate) return;
          if (!productsMap.has(entry.productId)) return;

          const isExpired = new Date(entry.validityDate) < now;
          if (!isExpired) return;

          const product = productsMap.get(entry.productId)!;
          const current = byProduct.get(entry.productId);
          if (current) {
            current.quantity += entry.quantityOnStock;
          } else {
            byProduct.set(entry.productId, {
              productId: entry.productId,
              productName: product.name,
              quantity: entry.quantityOnStock,
            });
          }
        });

        setExpired(
          Array.from(byProduct.values()).sort(
            (a, b) => b.quantity - a.quantity,
          ),
        );
      })
      .catch(() => toast.error("Erro ao verificar produtos vencidos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading || expired.length === 0) return null;

  return (
    <div
      className="flex w-full flex-shrink-0 flex-col rounded-md border border-red-200 bg-red-50 p-3 lg:w-64"
      style={{ height: 208 }}
    >
      <div className="mb-2 flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Produtos vencidos ({expired.length})
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {expired.map((product) => (
          <div
            key={product.productId}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="truncate text-gray-700" title={product.productName}>
              {product.productName}
            </span>
            <span className="flex-shrink-0 font-medium text-red-700">
              {product.quantity} un.
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 flex-shrink-0 text-[10px] text-red-600">
        Declare a perda desses produtos no Estoque.
      </p>
    </div>
  );
};

export default ExpiredProductsWarning;
