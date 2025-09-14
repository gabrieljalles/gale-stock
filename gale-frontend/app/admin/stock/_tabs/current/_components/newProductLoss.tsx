"use client";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useStockTransactions } from "@/_store/stock/StockTransactionContext";
import {
  StockEntryDetailWithStock,
  ReasonLoss,
  reasonLossLabels,
} from "@/_types";
import { Trash2, Loader2, Package, AlertTriangle } from "lucide-react";
import { createLostEntry } from "@/api/lostEntry";

// Tipo para produtos agrupados
interface GroupedProduct {
  productId: string;
  productName: string;
  imgUrl?: string;
  totalQuantity: number;
  stockEntries: StockEntryDetailWithStock[];
  validityDates: Array<{
    date: string;
    quantity: number;
    stockEntryDetailIds: string[]; // Array para múltiplas entradas com a mesma data
  }>;
}

const formSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  reasonLoss: z.nativeEnum(ReasonLoss),
  validityDate: z.string().optional(), // Sempre opcional
  note: z.string().optional(),
});

type FormData = {
  productId: string;
  quantity: number;
  reasonLoss: ReasonLoss;
  validityDate?: string;
  note?: string;
};

export default function NewProductLoss() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productsInStock, setProductsInStock] = useState<
    StockEntryDetailWithStock[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getProductsInStock } = useStockTransactions();

  // Agrupar produtos por productId e agrupar datas iguais
  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: GroupedProduct } = {};

    productsInStock.forEach((stockEntry) => {
      if (!groups[stockEntry.productId]) {
        groups[stockEntry.productId] = {
          productId: stockEntry.productId,
          productName: stockEntry.productName,
          imgUrl: stockEntry.imgUrl,
          totalQuantity: 0,
          stockEntries: [],
          validityDates: [],
        };
      }

      groups[stockEntry.productId].totalQuantity += stockEntry.quantityOnStock;
      groups[stockEntry.productId].stockEntries.push(stockEntry);

      // Verificar se já existe uma entrada para esta data
      const existingValidityIndex = groups[
        stockEntry.productId
      ].validityDates.findIndex((v) => v.date === stockEntry.validityDate);

      if (existingValidityIndex >= 0) {
        // Agrupar com data existente
        groups[stockEntry.productId].validityDates[
          existingValidityIndex
        ].quantity += stockEntry.quantityOnStock;
        groups[stockEntry.productId].validityDates[
          existingValidityIndex
        ].stockEntryDetailIds.push(stockEntry.id);
      } else {
        // Criar nova entrada de data
        groups[stockEntry.productId].validityDates.push({
          date: stockEntry.validityDate,
          quantity: stockEntry.quantityOnStock,
          stockEntryDetailIds: [stockEntry.id],
        });
      }
    });

    return Object.values(groups);
  }, [productsInStock]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const selectedProductId = watch("productId");
  const selectedValidityDate = watch("validityDate");
  const selectedReason = watch("reasonLoss");
  const quantity = watch("quantity");

  // Verificar se deve mostrar o campo de validade
  const shouldShowValidityField =
    selectedReason === ReasonLoss.Expiration ||
    selectedReason === ReasonLoss.DamagedProduct;

  const selectedProduct = groupedProducts.find(
    (p) => p.productId === selectedProductId,
  );

  // Calcular quantidade máxima baseada na validade selecionada (se houver)
  const maxQuantity = useMemo(() => {
    if (!selectedProduct) return 0;

    if (selectedValidityDate) {
      const validityOption = selectedProduct.validityDates.find(
        (v) => v.date === selectedValidityDate,
      );
      return validityOption?.quantity || 0;
    }

    // Se não selecionou validade, mostrar total disponível
    return selectedProduct.totalQuantity;
  }, [selectedProduct, selectedValidityDate]);

  // Validação dinâmica da quantidade quando maxQuantity mudar ou quantidade for digitada
  useEffect(() => {
    if (quantity && maxQuantity > 0) {
      if (quantity > maxQuantity) {
        setError("quantity", {
          type: "max",
          message: `Quantidade não pode ser maior que ${maxQuantity} unidades`,
        });
      } else {
        clearErrors("quantity");
      }
    }
  }, [quantity, maxQuantity, setError, clearErrors]);

  const fetchProductsInStock = async () => {
    setLoading(true);
    try {
      const products = await getProductsInStock();
      setProductsInStock(products);
    } catch (error) {
      console.error("Erro ao buscar produtos em estoque:", error);
      toast.error("Erro ao carregar produtos em estoque");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsInStock();
  }, []);

  const handleLossSuccess = () => {
    toast.success("Perda registrada no sistema!");
    // Atualizar a lista de produtos em estoque
    fetchProductsInStock();
  };

  const handleReasonChange = (reason: ReasonLoss) => {
    setValue("reasonLoss", reason);
    // Limpar campos dependentes quando mudar o motivo
    setValue("validityDate", "");
  };

  const handleProductChange = (productId: string) => {
    setValue("productId", productId);
    // Limpar campos dependentes
    setValue("validityDate", "");
    setValue("quantity", 0); // Limpar quantidade também
  };

  const handleValidityDateChange = (validityDate: string) => {
    setValue("validityDate", validityDate);
    setValue("quantity", 0); // Limpar quantidade quando mudar a data
  };

  const onSubmit = async (data: FormData) => {
    // Validação adicional antes do submit
    if (data.quantity > maxQuantity) {
      setError("quantity", {
        type: "max",
        message: `Quantidade não pode ser maior que ${maxQuantity} unidades disponíveis`,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Agora o backend espera a nova estrutura e gerencia a seleção automaticamente
      await createLostEntry({
        productId: selectedProduct?.productId || "",
        validityDate: data.validityDate || undefined, // Enviar data de validade se selecionada
        quantity: data.quantity,
        reasonLoss: data.reasonLoss,
        note: data.note || undefined,
      });

      toast.success("Perda declarada com sucesso!");
      reset();
      setIsDialogOpen(false);
      handleLossSuccess();
    } catch (error) {
      console.error("Erro ao declarar perda:", error);
      toast.error("Erro ao declarar perda", {
        description: "Não foi possível registrar a perda. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={loading || productsInStock.length === 0}
        variant="outline"
        className="hover:bg-primary hover:text-white"
      >
        <Trash2 />
        Declarar Perda
      </Button>

      {/* Dialog de declaração de perda */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Declarar Perda de Produto
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Seleção do Produto */}
            <div className="space-y-2">
              <label htmlFor="productId" className="text-sm font-medium">
                Produto *
              </label>
              <Select onValueChange={handleProductChange}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                  {groupedProducts.map((product) => (
                    <SelectItem
                      key={product.productId}
                      value={product.productId}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={product.imgUrl}
                          alt={product.productName}
                          className="h-6 w-6 rounded object-cover"
                        />
                        <div className="flex flex-col">
                          <span>{product.productName}</span>
                          <span className="text-xs text-gray-500">
                            Total em estoque: {product.totalQuantity} unidades
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && (
                <p className="text-sm text-red-500">
                  {errors.productId.message}
                </p>
              )}
            </div>

            {/* Motivo da Perda */}
            <div className="space-y-2">
              <label htmlFor="reasonLoss" className="text-sm font-medium">
                Motivo da Perda *
              </label>
              <Select onValueChange={handleReasonChange}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                  {Object.entries(reasonLossLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reasonLoss && (
                <p className="text-sm text-red-500">
                  {errors.reasonLoss.message}
                </p>
              )}
            </div>

            {/* Campo de Data de Validade */}
            {selectedProduct && (
              <div className="space-y-2">
                <label htmlFor="validityDate" className="text-sm font-medium">
                  Data de Validade
                </label>
                <Select onValueChange={handleValidityDateChange}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Campo vazio se não souber" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                    {selectedProduct.validityDates.map((validity, index) => (
                      <SelectItem key={index} value={validity.date}>
                        <div className="flex w-full items-center justify-between">
                          <span>
                            {new Date(validity.date).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {validity.quantity} unidades
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.validityDate && (
                  <p className="text-sm text-red-500">
                    {errors.validityDate.message}
                  </p>
                )}
              </div>
            )}

            {/* Quantidade */}
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantidade Perdida *
              </label>
              <Input
                type="number"
                min="1"
                max={maxQuantity}
                placeholder="Digite a quantidade"
                className="w-full bg-white"
                {...register("quantity")}
              />
              {selectedProduct && (
                <p className="text-sm text-gray-500">
                  {selectedValidityDate
                    ? `Máximo disponível para esta data: ${maxQuantity} unidades`
                    : `Máximo disponível total: ${maxQuantity} unidades`}
                </p>
              )}
              {errors.quantity && (
                <p className="text-sm text-red-500">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium">
                Observações
              </label>
              <textarea
                placeholder="Descreva mais detalhes sobre a perda (opcional)"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("note")}
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="default"
                className="text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Declarando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Declarar Perda
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
