"use client";
import { Button } from "@/_components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import ProductFormFields from "./ProductFormFields";
import { categoryMap, sizeTypeOptions } from "@/_constants/product";
import { updateProduct } from "@/api/product";
import { useProducts } from "@/_store/products/ProductContext";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ProductProps } from "@/_types";

const schema = z.object({
  name: z
    .string()
    .min(1, "Nome do produto é obrigatório (exe: Coca-cola 310ml)"),
  category: z.string(),
  barCode: z.string().min(1, "Código de barras é obrigatório"),
  description: z.string().max(250, "No máximo 250 caracteres"),
  sizeType: z.enum([...sizeTypeOptions] as [string, ...string[]], {
    required_error: "Tipo de tamanho obrigatório",
  }),
  size: z
    .string()
    .min(1, "Tamanho obrigatório")
    .max(4, "Tamanho deve ter no máximo 4 caracteres")
    .refine((val) => {
      const numberRegex = /^\d+([,.]?\d+)?$/;
      return numberRegex.test(val);
    }, "Formato inválido. Use números como: 2,5 ou 310"),
  pack: z
    .string()
    .min(1, "Pack obrigatório")
    .max(3, "Pack deve ter no máximo 3 caracteres"),
  imgUrl: z.string().url("URL da imagem inválida"),
});

type FormData = z.infer<typeof schema>;

interface EditProductProps {
  product: ProductProps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProduct = ({ product, open, onOpenChange }: EditProductProps) => {
  const { updateProduct: updateProductInContext } = useProducts();

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (open) {
      reset({
        name: product.name,
        category: product.category,
        barCode: product.barCode ?? "",
        description: product.description ?? "",
        sizeType: product.sizeType,
        size: product.size,
        pack: String(product.pack),
        imgUrl: product.imgUrl,
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const sizeFormatted = data.size.replace(",", ".");
      const updated = await updateProduct(product.id, {
        name: data.name,
        category: data.category as keyof typeof categoryMap,
        barCode: data.barCode,
        description: data.description,
        sizeType: data.sizeType as "g" | "L" | "ml" | "mg" | "kg" | "un",
        size: sizeFormatted,
        pack: Number(data.pack),
        imgUrl: data.imgUrl,
      });
      toast.success("Produto atualizado com sucesso!");
      updateProductInContext(product.id, updated);
      onOpenChange(false);
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao atualizar produto. Tente novamente.");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="fixed right-0 top-0 flex h-screen w-full max-w-[360px] flex-col rounded-md border-l bg-white shadow-lg">
        <DrawerHeader className="py-2">
          <DrawerTitle>Editar Produto</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" className="absolute right-2 top-2">
              X
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3"
          >
            <ProductFormFields mode="edit" />

            <div className="flex gap-2 border-t pt-3">
              <Button
                type="submit"
                className="flex-1 text-white hover:bg-green-500"
              >
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 hover:border-red-500 hover:text-red-500"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </FormProvider>
      </DrawerContent>
    </Drawer>
  );
};

export default EditProduct;
