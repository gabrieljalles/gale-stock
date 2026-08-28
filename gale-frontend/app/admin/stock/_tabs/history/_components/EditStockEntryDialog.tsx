"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Loader2, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { updateStockEntryDetail } from "@/api/stock";

interface EditStockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id: string;
    productName: string;
    quantityOnStock: number;
    validityDate: string | null;
  } | null;
  onUpdated: () => void;
}

const toInputDate = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export function EditStockEntryDialog({
  open,
  onOpenChange,
  entry,
  onUpdated,
}: EditStockEntryDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setQuantity(String(entry.quantityOnStock));
      setValidityDate(toInputDate(entry.validityDate));
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;

    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error("Quantidade inválida", {
        description: "Informe um número maior ou igual a zero.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateStockEntryDetail(entry.id, {
        quantityOnStock: parsedQuantity,
        ...(validityDate && { validityDate }),
      });
      toast.success("Entrada de estoque atualizada com sucesso!");
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar entrada de estoque:", error);
      toast.error("Erro ao atualizar entrada de estoque", {
        description: "Não foi possível salvar a correção. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5" />
            Corrigir lote de estoque
          </DialogTitle>
          <DialogDescription>
            {entry?.productName} — ajuste a quantidade (erro de digitação ou
            contagem física) e/ou a data de validade deste lote.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="quantityOnStock">Quantidade em estoque</Label>
            <Input
              id="quantityOnStock"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="validityDate">Data de validade</Label>
            <Input
              id="validityDate"
              type="date"
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar correção"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
