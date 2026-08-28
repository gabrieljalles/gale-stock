import { CatalogItem, UpdateCatalogPriceDto } from "@/api/catalog";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { useCatalog } from "@/_store/catalog/CatalogContext";
import { formatCurrency } from "@/_utils/formatCurrency";
import { useState } from "react";
import { toast } from "sonner";

interface EditPriceModalProps {
  item: CatalogItem;
  open: boolean;
  onClose: () => void;
}

export const EditPriceModal = ({
  item,
  open,
  onClose,
}: EditPriceModalProps) => {
  const { updateItemPrice } = useCatalog();
  const [loading, setLoading] = useState(false);

  const [prices, setPrices] = useState({
    consumerPrice: item.consumerPrice || 0,
    consumerNightPrice: item.consumerNightPrice || 0,
    consumerIfoodPrice: item.consumerIfoodPrice || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const updateData: UpdateCatalogPriceDto = {};

      if (prices.consumerPrice !== item.consumerPrice) {
        updateData.consumerPrice = prices.consumerPrice;
      }
      if (prices.consumerNightPrice !== item.consumerNightPrice) {
        updateData.consumerNightPrice = prices.consumerNightPrice;
      }
      if (prices.consumerIfoodPrice !== item.consumerIfoodPrice) {
        updateData.consumerIfoodPrice = prices.consumerIfoodPrice;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("Nenhuma alteração foi feita nos preços");
        onClose();
        return;
      }

      await updateItemPrice(item.id, updateData);
      toast.success("Preços atualizados com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar preços:", error);
      toast.error("Erro ao atualizar preços. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (field: keyof typeof prices, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPrices((prev) => ({ ...prev, [field]: numericValue }));
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="mx-auto max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>Editar Preços - {item.product.name}</DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Preço Normal */}
          <div className="space-y-2">
            <Label htmlFor="consumerPrice">Preço Normal</Label>
            <Input
              id="consumerPrice"
              type="number"
              step="0.01"
              min="0"
              value={prices.consumerPrice}
              onChange={(e) =>
                handlePriceChange("consumerPrice", e.target.value)
              }
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500">
              Atual:{" "}
              {item.consumerPrice
                ? formatCurrency(item.consumerPrice)
                : "Não definido"}
            </p>
          </div>

          {/* Preço Noturno */}
          <div className="space-y-2">
            <Label htmlFor="consumerNightPrice">Preço Noturno</Label>
            <Input
              id="consumerNightPrice"
              type="number"
              step="0.01"
              min="0"
              value={prices.consumerNightPrice}
              onChange={(e) =>
                handlePriceChange("consumerNightPrice", e.target.value)
              }
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500">
              Atual:{" "}
              {item.consumerNightPrice
                ? formatCurrency(item.consumerNightPrice)
                : "Não definido"}
            </p>
          </div>

          {/* Preço Delivery */}
          <div className="space-y-2">
            <Label htmlFor="consumerIfoodPrice">Preço Delivery (iFood)</Label>
            <Input
              id="consumerIfoodPrice"
              type="number"
              step="0.01"
              min="0"
              value={prices.consumerIfoodPrice}
              onChange={(e) =>
                handlePriceChange("consumerIfoodPrice", e.target.value)
              }
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500">
              Atual:{" "}
              {item.consumerIfoodPrice
                ? formatCurrency(item.consumerIfoodPrice)
                : "Não definido"}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Atualizando..." : "Atualizar Preços"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
