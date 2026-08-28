import { useStockTransactions } from "@/_store/stock/StockTransactionContext";
import { StockEntryDetailWithStock } from "@/_types";
import {
  Package,
  Calendar,
  DollarSign,
  AlertTriangle,
  Search,
  SortAsc,
  Hash,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getProducts } from "@/api/product";
import { getStockEntryDetails } from "@/api/stock";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { getValidityStatus } from "@/_utils/validityStatus";

interface ValidityDate {
  date: string | null;
  quantity: number;
}

interface GroupedProduct {
  productId: string;
  productName: string;
  imgUrl?: string;
  totalQuantity: number;
  validityDates: ValidityDate[];
  latestTransaction: {
    baseUnitCost: number;
    landedUnitCost?: number;
    date: string;
  } | null;
  nearestExpiryDate?: string | null;
}

type SortOption = "name" | "validity" | "quantity";

const ProductOnStockCard = () => {
  const [allProducts, setAllProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtro e ordenação
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const { getProductsInStock, stockTransactions } = useStockTransactions();

  // Buscar e agrupar produtos em estoque
  const fetchAndGroupProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar todos os produtos e detalhes de estoque
      const [allProducts, allStockDetails] = await Promise.all([
        getProducts(),
        getStockEntryDetails(),
      ]);

      // Criar grupos com todos os produtos
      const productGroups: { [key: string]: GroupedProduct } = {};

      // Inicializar com todos os produtos
      allProducts.forEach((product) => {
        productGroups[product.id] = {
          productId: product.id,
          productName: product.name,
          imgUrl: product.imgUrl,
          totalQuantity: 0,
          validityDates: [],
          latestTransaction: null,
        };
      });

      // Adicionar dados de estoque apenas para produtos que têm estoque
      allStockDetails.forEach((entry: any) => {
        // Só processar se o produto tem quantidade em estoque
        if (entry.quantityOnStock > 0 && productGroups[entry.productId]) {
          const group = productGroups[entry.productId];
          group.totalQuantity += entry.quantityOnStock;

          // Agrupar por data de validade
          const existingValidityIndex = group.validityDates.findIndex(
            (v) => v.date === entry.validityDate,
          );

          if (existingValidityIndex !== -1) {
            group.validityDates[existingValidityIndex].quantity +=
              entry.quantityOnStock;
          } else {
            group.validityDates.push({
              date: entry.validityDate,
              quantity: entry.quantityOnStock,
            });
          }
        }
      });

      // Ordenar datas de validade em ordem crescente e encontrar transação mais recente
      Object.values(productGroups).forEach((group) => {
        // Ordenar datas de validade
        group.validityDates.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // Encontrar transação mais recente para este produto
        const productTransactions = stockTransactions
          ?.flatMap((transaction) =>
            (transaction.stockEntryDetail || [])
              .filter((detail: any) => detail.productId === group.productId)
              .map((detail: any) => ({
                baseUnitCost: detail.baseUnitCost,
                landedUnitCost: detail.landedUnitCost,
                date: transaction.createdAt,
              })),
          )
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        if (productTransactions && productTransactions.length > 0) {
          group.latestTransaction = productTransactions[0];
        }

        // Calcular data de validade mais próxima
        const validDates = group.validityDates
          .filter((v) => v.date)
          .map((v) => v.date!)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        group.nearestExpiryDate = validDates.length > 0 ? validDates[0] : null;
      });

      setAllProducts(Object.values(productGroups));
    } catch (error) {
      console.error("Erro ao buscar produtos em estoque:", error);
      setError("Erro ao carregar produtos em estoque");
      toast.error("Erro ao carregar produtos em estoque");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndGroupProducts();
  }, [stockTransactions]);

  // Filtragem e ordenação dos produtos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProducts.filter((product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    switch (sortBy) {
      case "validity":
        filtered.sort((a, b) => {
          // Produtos sem estoque vão para o final
          if (a.totalQuantity === 0 && b.totalQuantity > 0) return 1;
          if (b.totalQuantity === 0 && a.totalQuantity > 0) return -1;

          // Se ambos têm estoque, ordenar por data de validade mais próxima
          if (!a.nearestExpiryDate && !b.nearestExpiryDate) return 0;
          if (!a.nearestExpiryDate) return 1;
          if (!b.nearestExpiryDate) return -1;

          return (
            new Date(a.nearestExpiryDate).getTime() -
            new Date(b.nearestExpiryDate).getTime()
          );
        });
        break;

      case "quantity":
        filtered.sort((a, b) => {
          // Produtos sem estoque primeiro, depois por quantidade crescente
          if (a.totalQuantity === 0 && b.totalQuantity === 0) return 0;
          if (a.totalQuantity === 0) return -1;
          if (b.totalQuantity === 0) return 1;
          return a.totalQuantity - b.totalQuantity;
        });
        break;

      case "name":
      default:
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
    }

    return filtered;
  }, [allProducts, searchTerm, sortBy]);

  if (loading) return <div className="p-4">Carregando produtos...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error}</div>;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Controles de Filtro e Busca - Fixos */}
      <div className="mb-1 flex-shrink-0">
        <div className="flex flex-col items-start justify-between gap-1 p-1 sm:flex-row sm:items-center">
          <div className="w-full flex-1 sm:mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("name")}
              className={`flex items-center gap-2 ${
                sortBy === "name" ? "text-white" : ""
              }`}
            >
              <SortAsc className="h-4 w-4" />
              Nome
            </Button>

            <Button
              variant={sortBy === "validity" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("validity")}
              className={`flex items-center gap-2 ${
                sortBy === "validity" ? "text-white" : ""
              }`}
            >
              <Calendar className="h-4 w-4" />
              Validade
            </Button>

            <Button
              variant={sortBy === "quantity" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("quantity")}
              className={`flex items-center gap-2 ${
                sortBy === "quantity" ? "text-white" : ""
              }`}
            >
              <Hash className="h-4 w-4" />
              Quantidade
            </Button>
          </div>
        </div>
      </div>

      {/* Área de Conteúdo com Scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Nenhum produto em estoque
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 rounded bg-gray-50 p-1 md:grid-cols-3 lg:grid-cols-5">
            {filteredAndSortedProducts.map((product: GroupedProduct) => (
              <div
                key={product.productId}
                className="flex max-h-[340px] flex-col rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Cabeçalho do produto */}
                <div className="mb-3 flex items-center gap-3">
                  {product.imgUrl ? (
                    <img
                      src={product.imgUrl}
                      alt={product.productName}
                      className="h-10 w-10 flex-shrink-0 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xs font-medium text-gray-900">
                      {product.productName}
                    </h3>
                    {product.totalQuantity > 0 ? (
                      <p className="text-xs text-gray-500">
                        Total:{" "}
                        <span className="font-semibold">
                          {product.totalQuantity}
                        </span>{" "}
                        un
                      </p>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">Sem estoque</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Datas de validade */}
                {product.totalQuantity > 0 ? (
                  <div className="mb-3 min-h-0 flex-1">
                    <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4" />
                      Validades
                    </h4>
                    <div className="max-h-16 space-y-0.5 overflow-y-auto overflow-x-hidden pr-1">
                      {product.validityDates.map(
                        (validity: ValidityDate, index: number) => {
                          const validityInfo = getValidityStatus(validity.date);
                          return (
                            <div
                              key={index}
                              className="flex flex-wrap items-center justify-between gap-x-1 rounded bg-gray-50 px-1.5 py-0.5 text-xs"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span
                                  className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${validityInfo.color}`}
                                ></span>
                                <div className="flex min-w-0 flex-wrap items-center gap-1">
                                  {validityInfo.days !== null && (
                                    <span className="flex-shrink-0 rounded bg-gray-200 px-1 text-[10px] font-medium text-gray-600">
                                      {validityInfo.days === "Vencido"
                                        ? "Vencido"
                                        : `${validityInfo.days}${typeof validityInfo.days === "number" ? "d" : ""}`}
                                    </span>
                                  )}
                                  <span className="truncate">
                                    {validity.date
                                      ? new Date(
                                          validity.date,
                                        ).toLocaleDateString("pt-BR")
                                      : "Sem validade"}
                                  </span>
                                </div>
                              </div>
                              <span className="flex-shrink-0 font-medium">
                                {validity.quantity}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="rounded border border-gray-500 bg-gray-50 px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Produto fora de estoque
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Necessário reabastecer
                      </p>
                    </div>
                  </div>
                )}

                {/* Preços da transação mais recente */}
                {product.latestTransaction && (
                  <div className="mt-auto border-t pt-2">
                    <h4 className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-700">
                      <DollarSign className="h-3 w-3" />
                      Preços
                    </h4>
                    <div className="space-y-0.5 text-xs">
                      {product.latestTransaction.landedUnitCost && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custo cheio:</span>
                          <span className="font-medium">
                            R${" "}
                            {Number(
                              product.latestTransaction.landedUnitCost,
                            ).toFixed(4)}
                          </span>
                        </div>
                      )}
                      {product.latestTransaction.baseUnitCost && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custo s/frete:</span>
                          <span className="font-medium">
                            R${" "}
                            {Number(
                              product.latestTransaction.baseUnitCost,
                            ).toFixed(4)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última compra:</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(
                            product.latestTransaction.date,
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOnStockCard;
