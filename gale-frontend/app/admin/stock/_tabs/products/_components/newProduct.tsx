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
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import NameInputAutocomplete from "./nameAutoCompleteInput";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import {
  categoryOptions,
  translateCategory,
  sizeTypeOptions,
  translateSizeType,
  categoryMap,
} from "@/_constants/product";
import { Input } from "@/_components/ui/input";
import ImageUploadInput from "./imageUploadInput";
import { AuthContext } from "@/_store/auth/AuthContext";
import { createProduct } from "@/api/product";
import { useProducts } from "@/_store/products/ProductContext";
import { toast } from "sonner";

const categoryEnum = z.enum(categoryOptions as [keyof typeof categoryMap, ...(keyof typeof categoryMap)[]]);

const schema = z.object({
  name: z
    .string()
    .min(1, "Nome do produto é obrigatório (exe: Coca-cola 310ml)"),
  category: z.string(),
  description: z.string().max(250, "No máximo 250 caracteres"),
  sizeType: z.enum([...sizeTypeOptions] as [string, ...string[]], {
    required_error: "Tipo de tamanho obrigatório",
  }),
  size: z
  .string()
  .min(1, "Tamanho obrigatório")
  .max(4, "Tamanho deve ter no máximo 4 caracteres"),
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
  const {addProduct} = useProducts();

  if (!user || !["Admin"].includes(user.role)) {
    return <div></div>;
  }

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: FormData) => {
    try {
      const created = await createProduct({
        name: data.name,
        category: data.category as keyof typeof categoryMap,
        description: data.description,
        sizeType: data.sizeType as "g" | "L" | "ml" | "mg" | "kg" | "un",
        size: data.size, 
        pack: Number(data.pack),
        imgUrl: data.imgUrl,
      });
      toast.success("Produto criado com sucesso!");   
      addProduct(created);
      reset();
      setOpen(false);
      toast.success("Produto criado com sucesso!"); 
    } catch (error) {}
    reset();
    setOpen(false);
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
          <DrawerHeader>
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
              className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto"
            >
              {/* Nome */}
              <div>
                <label className="mb-1 block text-xs font-bold">Nome</label>
                <NameInputAutocomplete {...methods.register("name")} />
                {errors.name && (
                  <span className="text-xs text-red-500">
                    {errors.name.message}
                  </span>
                )}
              </div>

              {/*Categoria  */}
              <div>
                <label className="mb-1 block text-xs font-bold ">
                  Categoria
                  </label>
                <Controller
                  name="category"
                  control={methods.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectGroup>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {translateCategory(cat)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <span className="text-xs text-red-500">
                    {errors.category.message}
                  </span>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1 block text-xs font-bold ">
                  Descrição
                </label>
                <textarea
                  {...methods.register("description")}
                  className="min-h-[80px] w-full resize-y rounded border p-2"
                  placeholder="Descreva o produto"
                />
                {errors.description && (
                  <span className="text-xs text-red-500">
                    {errors.description.message}
                  </span>
                )}
              </div>

              {/* Tipo de tamanho */}
              <div>
                <label className="mb-1 block text-xs font-bold">Tipo</label>
                <Controller
                  name="sizeType"
                  control={methods.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione tipo..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectGroup>
                          {sizeTypeOptions.map((size) => (
                            <SelectItem key={size} value={size}>
                              {translateSizeType(size)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.sizeType && (
                  <span className="text-xs text-red-500">
                    {errors.sizeType.message}
                  </span>
                )}
              </div>

              {/* Tamanho */}
              <div>
                <label className="mb-1 block text-xs font-bold ">Tamanho</label>
                <Input
                  type="number"
                  {...methods.register("size")}
                  placeholder="Ex: 310"
                />
                {errors.size && (
                  <span className="text-xs text-red-500">
                    {errors.size.message}
                  </span>
                )}
              </div>

              {/* Pack*/}
              <div>
                <label className="mb-1 block text-xs font-bold ">Pack</label>
                <Input
                  type="text"
                  {...methods.register("pack")}
                  placeholder="Ex: 12, 18, Opte pelo pacote comercial"
                />
                {errors.pack && (
                  <span className="text-xs text-red-500">
                    {errors.pack.message}
                  </span>
                )}
              </div>

              {/* img */}
              <div>
                <Controller
                name = "imgUrl"
                control = {methods.control}
                render = {({ field }) => (
                  <ImageUploadInput 
                  value = {field.value}
                  onChange = {field.onChange}
                  />
                )}
                />
                {errors.imgUrl && (
                <span className="text-xs text-red-500">
                  {errors.imgUrl.message}
                </span>
                )}
              </div>

              <div className=" flex p-4 border-t gap-2">
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
