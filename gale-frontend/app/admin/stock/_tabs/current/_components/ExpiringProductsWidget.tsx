import { useStockTransactions } from "@/_store/stock/StockTransactionContext";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getProducts } from "@/api/product";
import { getStockEntryDetails } from "@/api/stock";
import { getValidityStatus } from "@/_utils/validityStatus";
import { Calendar } from "lucide-react";

interface ExpiringProduct {
  productId: string;
  productName: string;
  quantity: number;
  daysUntilExpiry: number;
  statusColor: string;
}

const ExpiringProductsWidget = () => {
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const { stockTransactions } = useStockTransactions();

  // Buscar produtos próximos do vencimento
  const fetchExpiringProducts = async () => {
    setLoading(true);
    try {
      const [allProducts, allStockDetails] = await Promise.all([
        getProducts(),
        getStockEntryDetails(),
      ]);

      const productsMap = new Map(allProducts.map((p) => [p.id, p]));
      const expiringItems: ExpiringProduct[] = [];

      allStockDetails.forEach((entry: any) => {
        if (
          entry.quantityOnStock > 0 &&
          entry.validityDate &&
          productsMap.has(entry.productId)
        ) {
          const product = productsMap.get(entry.productId)!;
          const validityStatus = getValidityStatus(entry.validityDate);

          const validity = new Date(entry.validityDate);
          const now = new Date();
          const diffTime = validity.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 30) {
            expiringItems.push({
              productId: entry.productId,
              productName: product.name,
              quantity: entry.quantityOnStock,
              daysUntilExpiry: diffDays,
              statusColor: validityStatus.color,
            });
          }
        }
      });

      // Ordenar por dias até vencimento (mais próximo primeiro)
      expiringItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      setExpiringProducts(expiringItems);
    } catch (error) {
      console.error("Erro ao buscar produtos próximos do vencimento:", error);
      toast.error("Erro ao carregar produtos próximos do vencimento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringProducts();
  }, [stockTransactions]);

  // Agrupar produtos em 5 colunas por prazo
  const groupedProducts = useMemo(() => {
    const groups = {
      vencidos: [] as ExpiringProduct[],
      ate3dias: [] as ExpiringProduct[],
      ate7dias: [] as ExpiringProduct[],
      ate15dias: [] as ExpiringProduct[],
      ate30dias: [] as ExpiringProduct[],
    };

    expiringProducts.forEach((product) => {
      if (product.daysUntilExpiry < 0) {
        groups.vencidos.push(product);
      } else if (product.daysUntilExpiry <= 3) {
        groups.ate3dias.push(product);
      } else if (product.daysUntilExpiry <= 7) {
        groups.ate7dias.push(product);
      } else if (product.daysUntilExpiry <= 15) {
        groups.ate15dias.push(product);
      } else {
        groups.ate30dias.push(product);
      }
    });

    return groups;
  }, [expiringProducts]);

  if (loading || expiringProducts.length === 0) return null;

  return (
    <div className="flex-1 rounded border bg-white p-2 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-orange-500" />
        <h4 className="text-xs font-medium text-gray-700">
          Próximos ao Vencimento
        </h4>
        <span className="text-[10px] text-gray-500">
          ({expiringProducts.length})
        </span>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        style={{ fontSize: "10.5px" }}
      >
        {/* Coluna 1: Vencidos */}
        <div className="rounded border bg-gray-50 p-1.5">
          <div className="mb-1 flex items-center gap-1 font-medium text-gray-600">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-black"></div>
            <span>Vencidos</span>
          </div>
          <div className="space-y-0.5">
            {groupedProducts.vencidos.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span
                  className="truncate text-gray-800"
                  title={product.productName}
                >
                  {product.productName.length > 20
                    ? product.productName.substring(0, 20) + "..."
                    : product.productName}
                </span>
                <span className="text-gray-500">({product.quantity})</span>
              </div>
            ))}
            {groupedProducts.vencidos.length > 3 && (
              <div className="text-gray-400">
                +{groupedProducts.vencidos.length - 3} mais
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: ≤ 3 dias */}
        <div className="rounded border bg-gray-50 p-1.5">
          <div className="mb-1 flex items-center gap-1 font-medium text-gray-600">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-900"></div>
            <span>≤ 3 dias</span>
          </div>
          <div className="space-y-0.5">
            {groupedProducts.ate3dias.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span
                  className="truncate text-gray-800"
                  title={product.productName}
                >
                  {product.productName.length > 15
                    ? product.productName.substring(0, 15) + "..."
                    : product.productName}
                </span>
                <span className="text-gray-500">({product.quantity})</span>
              </div>
            ))}
            {groupedProducts.ate3dias.length > 3 && (
              <div className="text-gray-400">
                +{groupedProducts.ate3dias.length - 3} mais
              </div>
            )}
          </div>
        </div>

        {/* Coluna 3: 4-7 dias */}
        <div className="rounded border bg-gray-50 p-1.5">
          <div className="mb-1 flex items-center gap-1 font-medium text-gray-600">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500"></div>
            <span>4-7 dias</span>
          </div>
          <div className="space-y-0.5">
            {groupedProducts.ate7dias.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span
                  className="truncate text-gray-800"
                  title={product.productName}
                >
                  {product.productName.length > 15
                    ? product.productName.substring(0, 15) + "..."
                    : product.productName}
                </span>
                <span className="text-gray-500">({product.quantity})</span>
              </div>
            ))}
            {groupedProducts.ate7dias.length > 3 && (
              <div className="text-gray-400">
                +{groupedProducts.ate7dias.length - 3} mais
              </div>
            )}
          </div>
        </div>

        {/* Coluna 4: 8-15 dias */}
        <div className="rounded border bg-gray-50 p-1.5">
          <div className="mb-1 flex items-center gap-1 font-medium text-gray-600">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500"></div>
            <span>8-15 dias</span>
          </div>
          <div className="space-y-0.5">
            {groupedProducts.ate15dias.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span
                  className="truncate text-gray-800"
                  title={product.productName}
                >
                  {product.productName.length > 15
                    ? product.productName.substring(0, 15) + "..."
                    : product.productName}
                </span>
                <span className="text-gray-500">({product.quantity})</span>
              </div>
            ))}
            {groupedProducts.ate15dias.length > 3 && (
              <div className="text-gray-400">
                +{groupedProducts.ate15dias.length - 3} mais
              </div>
            )}
          </div>
        </div>

        {/* Coluna 5: 16-29 dias */}
        <div className="rounded border bg-gray-50 p-1.5">
          <div className="mb-1 flex items-center gap-1 font-medium text-gray-600">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500"></div>
            <span>16-29 dias</span>
          </div>
          <div className="space-y-0.5">
            {groupedProducts.ate30dias.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span
                  className="truncate text-gray-800"
                  title={product.productName}
                >
                  {product.productName.length > 15
                    ? product.productName.substring(0, 15) + "..."
                    : product.productName}
                </span>
                <span className="text-gray-500">({product.quantity})</span>
              </div>
            ))}
            {groupedProducts.ate30dias.length > 3 && (
              <div className="text-gray-400">
                +{groupedProducts.ate30dias.length - 3} mais
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiringProductsWidget;
