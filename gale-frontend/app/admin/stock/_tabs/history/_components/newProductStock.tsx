import React, { useState, useEffect } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { useProducts } from "@/_store/products/ProductContext";
import { NumericFormat } from "react-number-format";
import { StockEntryDetailProps } from "@/_types";
import { z } from "zod";
import { set } from "date-fns";
import { UndoDotIcon } from "lucide-react";

const productSchema = z.object({
  selectedProductId: z.string().min(1, "É obrigatório selecionar um produto."),
  boxesQuantity: z.coerce
    .number()
    .min(1, "A quantidade de caixas deve ser no mínimo 1."),
  unitsPerBox: z.coerce
    .number()
    .min(1, "Deve haver pelo menos 1 unidade por caixa."),
  validityDate: z
    .string()
    .min(1, "A data de validade é obrigatória.")
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(date);
        return inputDate >= today;
      },
      { message: "A data de validade não pode ser anterior a hoje." },
    ),
  costValue: z.coerce.number().min(0.01, "O custo deve ser maior que zero."),
});

interface ProductPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: StockEntryDetailProps[]) => void;
}

const ProductPopup = ({
  isOpen,
  onClose,
  onAddProducts,
}: ProductPopupProps) => {
  const { products, loading, error } = useProducts();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const [baseUnitCost, setBaseUnitCost] = useState<number>(0);
  const [totalProductCost, setTotalProductCost] = useState<number>(0);
  const [boxCost, setBoxCost] = useState<number>(0);

  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [validityDate, setValidityDate] = useState<string>("");
  const [boxesQuantity, setBoxesQuantity] = useState<string>("");
  const [unitsPerBox, setUnitsPerBox] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );
  const [costType, setCostType] = useState<"" | "caixa" | "unidade" | "total">(
    "",
  );
  const [costValue, setCostValue] = useState<number>(0);

  useEffect(() => {
    if (loading) return;
  }, [loading]);

  useEffect(() => {
    if (costType === "unidade" && costValue && boxesQuantity && unitsPerBox) {
      setCostValue(parseFloat(costValue.toFixed(4).replace(",", ".")));
      const calculatedTotalCost =
        costValue * Number(unitsPerBox) * Number(boxesQuantity);
      setTotalProductCost(parseFloat(calculatedTotalCost.toFixed(4)));
      setBaseUnitCost(costValue);
      setBoxCost(costValue * Number(unitsPerBox));
      setInitialQuantity(Number(boxesQuantity) * Number(unitsPerBox));
    } else if (
      costType === "caixa" &&
      costValue &&
      boxesQuantity &&
      unitsPerBox
    ) {
      setCostValue(parseFloat(costValue.toFixed(4).replace(",", ".")));
      const calculatedTotalCost = costValue * Number(boxesQuantity);
      const calculatedBaseUnitCost = costValue / Number(unitsPerBox);
      setTotalProductCost(parseFloat(calculatedTotalCost.toFixed(4)));
      setBaseUnitCost(parseFloat(calculatedBaseUnitCost.toFixed(4)));
      setBoxCost(costValue);
      setInitialQuantity(Number(boxesQuantity) * Number(unitsPerBox));
    } else if (
      costType === "total" &&
      costValue &&
      boxesQuantity &&
      unitsPerBox
    ) {
      setCostValue(parseFloat(costValue.toFixed(4).replace(",", ".")));
      setTotalProductCost(costValue);
      setBaseUnitCost(
        costValue / (Number(unitsPerBox) * Number(boxesQuantity)),
      );
      setBoxCost(costValue / Number(boxesQuantity));
      setInitialQuantity(Number(boxesQuantity) * Number(unitsPerBox));
    }
  }, [costType, costValue, boxesQuantity, unitsPerBox]);

  const handleSubmit = () => {
    const dataToValidate = {
      selectedProductId,
      validityDate,
      boxesQuantity: String(boxesQuantity).replace(",", "."),
      unitsPerBox: String(unitsPerBox).replace(",", "."),
      costValue: String(costValue).replace(",", "."),
    };

    const validationResult = productSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      return;
    } else {
      setErrors({});
    }

    const newProduct: StockEntryDetailProps = {
      productId: selectedProductId || "",
      productName:
        products?.find((p) => p.id === selectedProductId)?.name || "",
      baseUnitCost: baseUnitCost,
      initialQuantity: initialQuantity,
      totalProductCost: totalProductCost,
      validityDate: validityDate,
      imgUrl: products?.find((p) => p.id === selectedProductId)?.imgUrl || "",
    };

    onAddProducts([newProduct]);

    setSelectedProductId(null);
    setBaseUnitCost(0);
    setInitialQuantity(0);
    setTotalProductCost(0);
    setBoxCost(0);
    setValidityDate("");
    setBoxesQuantity("");
    setUnitsPerBox("");
    setCostType("unidade");
    setCostValue(0);

    onClose();
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">Selecione o Produto</h2>
        {loading && <p>Carregando produtos...</p>}
        {error && <p>Erro ao carregar produtos.</p>}

        {/* Produto */}
        {!loading && !error && products && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-1">
              {selectedProductId && (
                <img
                  src={
                    products.find((p) => p.id === selectedProductId)?.imgUrl ||
                    ""
                  }
                  className="h-10 w-10 rounded border object-contain"
                  alt="Imagem do produto selecionado."
                />
              )}
              <select
                className="w-full rounded border p-2"
                value={selectedProductId || ""}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="" disabled>
                  Selecione um produto
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.selectedProductId && (
              <p className="text-xs text-red-500">
                {errors.selectedProductId[0]}
              </p>
            )}
          </div>
        )}

        {/* Quantidades */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Qtd de caixas</label>
            <Input
              type="number"
              placeholder="0"
              value={boxesQuantity}
              onChange={(e) => setBoxesQuantity(e.target.value)}
              className="block rounded border px-2 py-1"
            />
            {errors.boxesQuantity && (
              <p className="text-xs text-red-500">{errors.boxesQuantity[0]}</p>
            )}
          </div>
          <div>
            <label className="m block text-sm font-medium">UN por caixa</label>
            <Input
              type="number"
              placeholder="0"
              value={unitsPerBox}
              onChange={(e) => setUnitsPerBox(e.target.value)}
              className="block rounded border bg-white px-2 py-1"
            />
            {errors.unitsPerBox && (
              <p className="text-xs text-red-500">{errors.unitsPerBox[0]}</p>
            )}
          </div>
        </div>

        {/* Data de validade */}
        <div className="mt-4">
          <label className="block text-sm font-medium">Data de validade</label>
          <Input
            type="date"
            placeholder="Data de Validade"
            value={validityDate}
            onChange={(e) => setValidityDate(e.target.value)}
            className="w-full rounded border px-2 py-1"
          />
          {errors.validityDate && (
            <p className="text-xs text-red-500">{errors.validityDate[0]}</p>
          )}
        </div>

        {/* Preço */}
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div className="mt-4">
            <label className="block text-sm font-medium">Tipo de Custo</label>
            <select
              className="w-full rounded border px-2 py-1"
              value={costType}
              onChange={(e) =>
                setCostType(e.target.value as "caixa" | "unidade" | "total")
              }
            >
              <option value="" disabled>
                Selecione o tipo
              </option>
              <option value="unidade">Custo por Unidade</option>
              <option value="caixa">Custo por Caixa</option>
              <option value="total">Custo Total</option>
            </select>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">Custo</label>
            <NumericFormat
              className="w-full rounded border px-2 py-1"
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              prefix="R$ "
              placeholder="Custo"
              value={costValue}
              onValueChange={(values) => {
                const { value } = values;
                setCostValue(Number(value));
              }}
            />
            {errors.costValue && (
              <p className="text-xs text-red-500">{errors.costValue[0]}</p>
            )}
          </div>
        </div>

        {/* {Calculo de custos} */}
        {costType !== "" && costValue > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <p className="text-xs">Qtd:</p>
                <p className="text-xs">{initialQuantity}</p>
              </div>
              <div>
                <p className="text-xs">Unidade:</p>
                <p className="text-xs">
                  R$ {baseUnitCost.toFixed(4).replace(".", ",")}
                </p>
              </div>
              <div>
                <p className="text-xs">Caixa:</p>
                <p className="text-xs">
                  R$ {boxCost.toFixed(4).replace(".", ",")}
                </p>
              </div>
              <div>
                <p className="text-xs">Total:</p>
                <p className="text-xs">
                  R$ {totalProductCost.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancelar
          </Button>
          <Button
            variant="default"
            className="text-white"
            onClick={handleSubmit}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPopup;
