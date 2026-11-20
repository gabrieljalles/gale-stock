import { CatalogItem } from "@/api/catalog";
import { Card, CardContent } from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { Pen, Package, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";

interface CatalogCardProps {
  item: CatalogItem;
}

export const CatalogCard = ({ item }: CatalogCardProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const handleEditPrice = () => {
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
        <CardContent className="flex flex-col gap-4 p-0">
          {/* Header com imagem e status */}
          <div className="relative">
            {item.product.imgUrl ? (
              <img
                src={item.product.imgUrl}
                alt={item.product.name}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div className="flex h-28 w-full items-center justify-center bg-gray-100">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {/* Badge de disponibilidade */}
            <div className="absolute right-1.5 top-1.5">
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  item.available
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {item.available ? "Disponível" : "Indisponível"}
              </span>
            </div>

            {/* Badge de liquidação */}
            {item.isLiquidation && (
              <div className="absolute left-1.5 top-1.5">
                <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                  Liquidação
                </span>
              </div>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="flex flex-col gap-2 p-2.5">
            {/* Nome e categoria */}
            <div>
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                {item.product.name}
              </h3>
              <p className="text-xs text-gray-600">
                {item.product.category} • {item.product.size}
                {item.product.sizeType}
              </p>
            </div>

            {/* Estoque */}
            <div className="flex items-center gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-gray-600">
                Estoque:{" "}
                <span className="font-semibold">{item.totalStock || 0} un</span>
              </span>
            </div>

            {/* Preços */}
            <div className="space-y-1">
              {item.consumerPrice && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Normal:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(item.consumerPrice)}
                  </span>
                </div>
              )}

              {item.consumerNightPrice && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Noturno:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(item.consumerNightPrice)}
                  </span>
                </div>
              )}

              {item.consumerIfoodPrice && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(item.consumerIfoodPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Data da última modificação */}
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Atualizado em: {formatLastUpdate(item.updatedAt)}
              </span>
            </div>

            {/* Botão de editar preço */}
            <Button
              onClick={handleEditPrice}
              className="mt-1 w-full bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
            >
              <Pen className="mr-1.5 h-3.5 w-3.5" />
              Editar Preços
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edição - temporariamente comentado */}
      {/* <EditPriceModal
        item={item}
        open={editOpen}
        onClose={handleCloseEdit}
      /> */}
    </>
  );
};
