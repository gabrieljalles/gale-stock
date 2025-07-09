"use client";
import { useState } from "react";
import { Button } from "@/_components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/_components/ui/input";
import { CirclePlus } from "lucide-react";
import { useSuppliers } from "@/_store/supplier/SupplierContext";

const schema = z.object({
    supplierId: z.string().min(1, "Fornecedor obrigatório"),
  product: z.string().min(1, "Produto obrigatório"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
});

type FormData = z.infer<typeof schema>;

const NewStock = () => {
  const [open, setOpen] = useState(false);
  const {suppliers, loading, error} = useSuppliers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Aqui você faz a requisição para criar o novo estoque
    // await createStock(data);
    reset();
    setOpen(false);
    // Exiba um toast ou mensagem de sucesso se quiser
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
        <DrawerContent className="max-w-md ml-auto">
          <DrawerHeader>
            <DrawerTitle>Novo Estoque</DrawerTitle>
          </DrawerHeader>
          <form
            className="flex flex-col gap-4 p-4"
            onSubmit={handleSubmit(onSubmit)}
          >
             <div>
              <label className="block text-sm font-medium">Fornecedor</label>
              <select
                {...register("supplierId")}
                className="w-full border rounded px-2 py-1"
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
              {errors.supplierId && (
                <span className="text-red-500 text-xs">
                  {errors.supplierId.message}
                </span>
              )}
              {error && (
                <span className="text-red-500 text-xs">
                  Erro ao carregar fornecedores
                </span>
              )}
            </div>
           
           
            <div className="flex gap-2 justify-end">
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DrawerClose>
              <Button type="submit" className="bg-primary text-white">
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