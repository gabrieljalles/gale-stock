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
import { CirclePlus } from "lucide-react";
import { useContext, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import ProductFormFields from "../_tabs/products/_components/ProductFormFields";
import { categoryMap, sizeTypeOptions } from "@/_constants/product";
import { AuthContext } from "@/_store/auth/AuthContext";
import { createProduct } from "@/api/product";
import { useProducts } from "@/_store/products/ProductContext";
import { toast } from "sonner";
import { isAxiosError } from "axios";

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

const NewProduct = () => {
  const [open, setOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { addProduct } = useProducts();

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  if (!user || !["Admin"].includes(user.role)) {
    return <div></div>;
  }

  const onSubmit = async (data: FormData) => {
    try {
      const sizeFormatted = data.size.replace(",", ".");
      const created = await createProduct({
        name: data.name,
        category: data.category as keyof typeof categoryMap,
        barCode: data.barCode,
        description: data.description,
        sizeType: data.sizeType as "g" | "L" | "ml" | "mg" | "kg" | "un",
        size: sizeFormatted,
        pack: Number(data.pack),
        imgUrl: data.imgUrl,
      });
      toast.success("Produto criado com sucesso!");
      addProduct(created);
      reset();
      setOpen(false);
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao criar produto. Tente novamente.");
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="hover:bg-primary hover:text-white"
      >
        <CirclePlus />
        Novo produto
      </Button>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="fixed right-0 top-0 flex h-screen w-full max-w-[360px] flex-col rounded-md border-l bg-white shadow-lg">
          <DrawerHeader className="py-2">
            <DrawerTitle>Novo Produto</DrawerTitle>
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
              <ProductFormFields mode="create" />

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
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </FormProvider>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NewProduct;
