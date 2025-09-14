"use client";
// Bibliotecas externas
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus, X } from "lucide-react";

// Módulos internos/locais
import { Button } from "@/_components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { Input } from "@/_components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";
import { CreateStockTransactionDto, StockEntryDetailProps } from "@/_types";
import { useSuppliers } from "@/_store/supplier/SupplierContext";

//Interfaces e tipos
import ProductPopup from "./newProductStock";
import { transactionTypes } from "@/_constants";
import { toast } from "sonner";
import { NumericFormat } from "react-number-format";
import { createStock } from "@/api/stock";
import { useStockTransactions } from "@/_store/stock/StockTransactionContext";

const transactionValues = transactionTypes.map((t) => t.value);

// Ensure transactionValues is a tuple for z.enum
const transactionValuesTuple = transactionValues as [string, ...string[]];

const schema = z.object({
  supplierId: z.string().min(1, "Fornecedor obrigatório"),
  transactionType: z.enum(transactionValuesTuple, {
    required_error: "Tipo de transação obrigatório",
    invalid_type_error: "Selecione um tipo de transação válido",
  }),
  firstPaymentDate: z.string().optional().or(z.literal("")),
  numberPayments: z.coerce.number().min(1, "Mínimo 1 parcela").optional(),
  feeCost: z.coerce
    .number()
    .min(0, "Taxa não pode ser negativa")
    .max(1000, "Taxa máxima é R$ 1000"),
  freightCost: z.coerce
    .number()
    .min(0, "Frete não pode ser negativo")
    .max(1000, "Frete máximo é R$ 1000"),
  nfeAccessKey: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const showInstallmentFields = (type: string) =>
  ["BankSlip", "CreditCard", "OnTheBill"].includes(type);

const getToday = () => {
  const now = new Date();
  return now.toISOString().slice(0, 16);
};

const NewStock = () => {
  const [open, setOpen] = useState(false);
  const { suppliers, loading, error } = useSuppliers();
  const [isProductPopupOpen, setIsProductPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockEntryDetails, setStockEntryDetails] = useState<
    StockEntryDetailProps[]
  >([]);
  const { refresh } = useStockTransactions();

  const resetForm = () => {
    reset({
      numberPayments: 1,
      firstPaymentDate: getToday(),
      feeCost: 0,
      freightCost: 0,
      nfeAccessKey: "",
    });
    setStockEntryDetails([]);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numberPayments: 1,
      firstPaymentDate: getToday(),
      feeCost: 0,
      freightCost: 0,
      nfeAccessKey: "",
    },
  });

  const transactionType = watch("transactionType");
  const feeCost = watch("feeCost") || 0;
  const freightCost = watch("freightCost") || 0;

  useEffect(() => {
    if (!showInstallmentFields(transactionType)) {
      setValue("numberPayments", 1);
      setValue("firstPaymentDate", getToday());
    }
  }, [transactionType, setValue]);

  const onSubmit = async (data: FormData) => {
    if (stockEntryDetails.length === 0) {
      toast.error("Adicione pelo menos um produto ao estoque.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular o custo total dos produtos
      const productTotal = stockEntryDetails.reduce(
        (acc, item) => acc + item.totalProductCost,
        0,
      );

      // Preparar os dados para a API
      const stockTransactionData: CreateStockTransactionDto = {
        supplierId: data.supplierId,
        transactionType:
          data.transactionType as CreateStockTransactionDto["transactionType"],
        numberPayments: data.numberPayments || 1,
        firstPaymentDate: data.firstPaymentDate || undefined,
        totalProductCost: productTotal,
        freightCost: data.freightCost || 0,
        feeCost: data.feeCost || 0,
        nfeAccessKey: data.nfeAccessKey || undefined,
        totalCost: productTotal + (data.freightCost || 0) + (data.feeCost || 0),
        stockEntryDetail: stockEntryDetails.map((item) => ({
          productId: item.productId,
          baseUnitCost: item.baseUnitCost,
          initialQuantity: item.initialQuantity,
          totalProductCost: item.totalProductCost,
          validityDate: item.validityDate,
        })),
        installments: [],
      };

      // Chamar a API
      const newTransaction = await createStock(stockTransactionData);
      
      // Fazer refresh dos dados para buscar a transação completa com produtos e installments
      await refresh();
      
      resetForm();
      setOpen(false);
      toast.success("Transação de estoque criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar transação de estoque:", error);
      if (error instanceof Error) {
        toast.error(`Erro ao criar transação: ${error.message}`);
      } else {
        toast.error("Erro interno. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenProductPopup = () => {
    setIsProductPopupOpen(true);
  };

  const handleCloseProductPopup = () => {
    setIsProductPopupOpen(false);
  };

  const handleAddProducts = (products: StockEntryDetailProps[]) => {
    setStockEntryDetails((prev) => [...prev, ...products]);
  };

  const handleRemoveProduct = (productId: string) => {
    setStockEntryDetails((currentProducts) =>
      currentProducts.filter((product) => product.productId !== productId),
    );
  };

  const calculateTotal = () => {
    const productTotal = stockEntryDetails.reduce(
      (acc, item) => acc + item.totalProductCost,
      0,
    );

    const feeCostNumber = Number(feeCost);
    const freightCostNumber = Number(freightCost);
    const total = productTotal + feeCostNumber + freightCostNumber;

    return total.toFixed(2);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="hover:bg-primary hover:text-white"
      >
        <CirclePlus />
        Novo estoque
      </Button>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="ml-auto flex h-full max-w-xl flex-col overflow-y-auto overflow-x-hidden">
          <DrawerHeader>
            <DrawerTitle>Novo Estoque</DrawerTitle>
          </DrawerHeader>
          <form
            className="flex flex-col gap-4 overflow-y-auto p-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col">
              <label className="block w-full text-sm font-medium">
                Fornecedor
              </label>
              <div className="flex h-12 gap-2">
                <select
                  {...register("supplierId")}
                  className="h-10 w-full rounded border p-2"
                  disabled={loading}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {loading ? "Carregando..." : "Selecione um fornecedor"}
                  </option>
                  {suppliers?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.enterprise || s.legalRepresentative}
                    </option>
                  ))}
                </select>
              </div>
              {errors.supplierId && (
                <span className="text-xs text-red-500">
                  {errors.supplierId.message}
                </span>
              )}
              {error && (
                <span className="text-xs text-red-500">
                  Erro ao carregar fornecedores
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Nota fiscal</label>
              <Input
                type="text"
                {...register("nfeAccessKey")}
                className="bg-white"
              />
              {errors.nfeAccessKey && (
                <span className="text-xs text-red-500">
                  {errors.nfeAccessKey.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Tipo de Transação
              </label>
              <select
                {...register("transactionType")}
                className="w-full rounded border px-2 py-1"
                defaultValue=""
              >
                {transactionTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.transactionType && (
                <span className="text-xs text-red-500">
                  {errors.transactionType.message}
                </span>
              )}
            </div>

            {/* Campos condicionais */}
            {showInstallmentFields(transactionType) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Primeira data
                  </label>
                  <Input
                    type="date"
                    {...register("firstPaymentDate")}
                    className="bg-white"
                  />
                  {errors.firstPaymentDate && (
                    <span className="text-xs text-red-500">
                      {errors.firstPaymentDate.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Número de pagamentos
                  </label>
                  <Input
                    className="bg-white"
                    type="number"
                    min={1}
                    {...register("numberPayments")}
                  />
                  {errors.numberPayments && (
                    <span className="text-xs text-red-500">
                      {errors.numberPayments.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Custos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Taxa</label>
                <NumericFormat
                  className="w-full rounded border px-2 py-1"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="R$ "
                  placeholder="Taxa"
                  value={feeCost}
                  onValueChange={(values) => {
                    const { value } = values;
                    setValue("feeCost", Number(value));
                  }}
                />
                {errors.feeCost && (
                  <span className="text-xs text-red-500">
                    {errors.feeCost.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Frete</label>
                <NumericFormat
                  className="w-full rounded border px-2 py-1"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="R$ "
                  placeholder="Frete"
                  value={freightCost}
                  onValueChange={(values) => {
                    const { value } = values;
                    setValue("freightCost", Number(value));
                  }}
                />
                {errors.freightCost && (
                  <span className="text-xs text-red-500">
                    {errors.freightCost.message}
                  </span>
                )}
              </div>
            </div>

            <Button
              type="button"
              className="hover:bg-success text-white"
              onClick={handleOpenProductPopup}
            >
              Adicionar Produtos
            </Button>

            <ProductPopup
              isOpen={isProductPopupOpen}
              onClose={handleCloseProductPopup}
              onAddProducts={handleAddProducts}
            />

            {/* Tabela de produtos adicionados */}
            <div className="flex w-full flex-col">
              <Table className="flex-1 flex-col bg-white">
                {stockEntryDetails.length === 0 && (
                  <TableCaption>Sem produtos adicionados</TableCaption>
                )}
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-xs font-extrabold">
                      Imagem
                    </TableHead>
                    <TableHead className="text-xs font-extrabold">
                      Produto
                    </TableHead>
                    <TableHead className="text-xs font-extrabold">
                      C.U
                    </TableHead>
                    <TableHead className="text-xs font-extrabold">
                      Qtd
                    </TableHead>
                    <TableHead className="text-xs font-extrabold">
                      Total
                    </TableHead>
                    <TableHead className="text-center text-xs font-extrabold">
                      Remover
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {stockEntryDetails.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        {product.imgUrl && (
                          <img
                            src={product.imgUrl}
                            alt={product.productName}
                            className="mx-auto h-4 w-4 rounded object-contain"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {product.productName}
                      </TableCell>
                      <TableCell className="text-xs">
                        R$ {product.baseUnitCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {product.initialQuantity}
                      </TableCell>
                      <TableCell className="text-xs">
                        R$ {product.totalProductCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-2 w-2"
                          onClick={() => handleRemoveProduct(product.productId)}
                        >
                          <X className="h-2 w-2 hover:text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {stockEntryDetails.length > 0 && (
                <div className="mt-2 text-right">
                  Total: R$ {calculateTotal()}
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-2">
              <DrawerClose asChild>
                <Button
                  className="bg-white"
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
              </DrawerClose>
              <Button type="submit" className="bg-green-500 text-white">
                Salvar
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NewStock;
