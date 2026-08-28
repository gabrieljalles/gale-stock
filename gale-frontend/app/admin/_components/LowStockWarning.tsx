"use client";

import { useEffect, useState } from "react";
import { PackageX } from "lucide-react";
import { toast } from "sonner";
import { getCatalogItems, CatalogItem } from "@/api/catalog";

// Quantidade a partir da qual um produto é considerado "quase acabando".
const LOW_STOCK_THRESHOLD = 5;

interface LowStockProduct {
  catalogId: string;
  productName: string;
  quantity: number;
}

const LowStockWarning = () => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCatalogItems()
      .then((items: CatalogItem[]) => {
        const lowOrOut = items
          .filter((item) => (item.totalStock ?? 0) <= LOW_STOCK_THRESHOLD)
          .map((item) => ({
            catalogId: item.id,
            productName: item.product.name,
            quantity: item.totalStock ?? 0,
          }))
          // Acabados primeiro, depois os mais próximos de zero.
          .sort((a, b) => a.quantity - b.quantity);

        setProducts(lowOrOut);
      })
      .catch(() => toast.error("Erro ao verificar estoque baixo."))
      .finally(() => setLoading(false));
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <div
      className="flex w-full flex-shrink-0 flex-col rounded-md border border-orange-200 bg-orange-50 p-3 lg:w-64"
      style={{ height: 208 }}
    >
      <div className="mb-2 flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-orange-700">
        <PackageX className="h-3.5 w-3.5" />
        Estoque baixo ({products.length})
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {products.map((product) => (
          <div
            key={product.catalogId}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span
              className="truncate text-gray-700"
              title={product.productName}
            >
              {product.productName}
            </span>
            <span
              className={`flex-shrink-0 font-medium ${
                product.quantity === 0 ? "text-red-700" : "text-orange-700"
              }`}
            >
              {product.quantity === 0 ? "Acabou" : `${product.quantity} un.`}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 flex-shrink-0 text-[10px] text-orange-600">
        Registre uma nova compra de estoque pra esses produtos.
      </p>
    </div>
  );
};

export default LowStockWarning;
