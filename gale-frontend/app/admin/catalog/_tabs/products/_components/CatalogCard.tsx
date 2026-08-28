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
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Badge de disponibilidade */}
            <div className="absolute right-2 top-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
              <div className="absolute left-2 top-2">
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  Liquidação
                </span>
              </div>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="flex flex-col gap-3 p-4">
            {/* Nome e categoria */}
            <div>
              <h3 className="line-clamp-2 font-semibold text-gray-900">
                {item.product.name}
              </h3>
              <p className="text-sm text-gray-600">
                {item.product.category} • {item.product.size}
                {item.product.sizeType}
              </p>
            </div>

            {/* Estoque */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                Estoque:{" "}
                <span className="font-semibold">{item.totalStock || 0} un</span>
              </span>
            </div>

            {/* Preços */}
            <div className="space-y-2">
              {item.consumerPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preço normal:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(item.consumerPrice)}
                  </span>
                </div>
              )}

              {item.consumerNightPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preço noturno:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(item.consumerNightPrice)}
                  </span>
                </div>
              )}

              {item.consumerIfoodPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preço delivery:</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(item.consumerIfoodPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Data da última modificação */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Atualizado em: {formatLastUpdate(item.updatedAt)}</span>
            </div>

            {/* Botão de editar preço */}
            <Button
              onClick={handleEditPrice}
              className="mt-2 w-full bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
            >
              <Pen className="mr-2 h-4 w-4" />
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
