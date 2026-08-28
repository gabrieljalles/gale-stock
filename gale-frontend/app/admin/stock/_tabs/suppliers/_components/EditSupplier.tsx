"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/_components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { Input } from "@/_components/ui/input";
import { SupplierProps } from "@/_types";
import { useSuppliers } from "@/_store/supplier/SupplierContext";
import { formatCpfCNPJ } from "@/_utils/format-cpf-cnpj";
import { formatPhone } from "@/_utils/format-phone";
import { validateCpfCNPJ } from "@/_utils/validate-cpf-cnpj";

const schema = z.object({
  legalRepresentative: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  enterprise: z
    .string()
    .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
    .max(100, "Nome da empresa muito longo"),
  completeAddress: z
    .string()
    .min(10, "Endereço deve ter pelo menos 10 caracteres")
    .max(200, "Endereço muito longo")
    .optional()
    .or(z.literal("")),
  cellphone: z
    .string()
    .min(14, "Telefone deve ter entre 14-16 caracteres")
    .max(16, "Telefone deve ter entre 14-16 caracteres")
    .refine((val) => {
      const numbers = val.replace(/\D/g, "");
      return numbers.length >= 10 && numbers.length <= 11;
    }, "Telefone inválido"),
  appName: z
    .string()
    .min(8, "CPF/CNPJ deve ter pelo menos 8 caracteres")
    .refine((val) => validateCpfCNPJ(val), "CPF/CNPJ inválido")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(50, "Nome da cidade muito longo"),
  email: z
    .string()
    .email("Email inválido")
    .max(100, "Email muito longo")
    .optional()
    .or(z.literal("")),
  imgUrl: z.string().url("URL da imagem inválida").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface EditSupplierProps {
  supplier: SupplierProps;
  open: boolean;
  onClose: () => void;
}

const EditSupplier = ({ supplier, open, onClose }: EditSupplierProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateSupplier } = useSuppliers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalRepresentative: supplier.legalRepresentative,
      enterprise: supplier.enterprise,
      completeAddress: supplier.completeAddress || "",
      cellphone: supplier.cellphone,
      appName: supplier.appName || "",
      city: supplier.city,
      email: supplier.email || "",
      imgUrl: supplier.imgUrl || "",
    },
  });

  const watchedCellphone = watch("cellphone");
  const watchedAppName = watch("appName");

  // Formatação automática do telefone
  useEffect(() => {
    if (watchedCellphone) {
      const formatted = formatPhone(watchedCellphone);
      if (formatted !== watchedCellphone) {
        setValue("cellphone", formatted);
      }
    }
  }, [watchedCellphone, setValue]);

  // Formatação automática do CPF/CNPJ
  useEffect(() => {
    if (watchedAppName) {
      const formatted = formatCpfCNPJ(watchedAppName);
      if (formatted !== watchedAppName) {
        setValue("appName", formatted);
      }
    }
  }, [watchedAppName, setValue]);

  // Reset form when supplier changes
  useEffect(() => {
    if (supplier) {
      reset({
        legalRepresentative: supplier.legalRepresentative,
        enterprise: supplier.enterprise,
        completeAddress: supplier.completeAddress || "",
        cellphone: supplier.cellphone,
        appName: supplier.appName || "",
        city: supplier.city,
        email: supplier.email || "",
        imgUrl: supplier.imgUrl || "",
      });
    }
  }, [supplier, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);

    try {
      // Atualizar fornecedor via API através do Context
      const supplierData = {
        ...data,
        imgUrl: data.imgUrl || "", // URL vazia se não fornecida
      };

      await updateSupplier(supplier.id, supplierData);
      toast.success("Fornecedor atualizado com sucesso!");
      handleClose();
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      if (error instanceof Error) {
        toast.error(`Erro ao atualizar fornecedor: ${error.message}`);
      } else {
        toast.error("Erro ao atualizar fornecedor. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            Editar Fornecedor
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerTitle>
        </DrawerHeader>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Representante Legal */}
              <div className="space-y-2">
                <label
                  htmlFor="legalRepresentative"
                  className="text-sm font-medium"
                >
                  Representante Legal *
                </label>
                <Input
                  id="legalRepresentative"
                  {...register("legalRepresentative")}
                  placeholder="Nome do representante legal"
                />
                {errors.legalRepresentative && (
                  <p className="text-sm text-red-500">
                    {errors.legalRepresentative.message}
                  </p>
                )}
              </div>

              {/* Nome da Empresa */}
              <div className="space-y-2">
                <label htmlFor="enterprise" className="text-sm font-medium">
                  Nome da Empresa *
                </label>
                <Input
                  id="enterprise"
                  {...register("enterprise")}
                  placeholder="Nome da empresa"
                />
                {errors.enterprise && (
                  <p className="text-sm text-red-500">
                    {errors.enterprise.message}
                  </p>
                )}
              </div>

              {/* CPF/CNPJ */}
              <div className="space-y-2">
                <label htmlFor="appName" className="text-sm font-medium">
                  CPF/CNPJ (opcional)
                </label>
                <Input
                  id="appName"
                  {...register("appName")}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
                {errors.appName && (
                  <p className="text-sm text-red-500">
                    {errors.appName.message}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label htmlFor="cellphone" className="text-sm font-medium">
                  Telefone *
                </label>
                <Input
                  id="cellphone"
                  {...register("cellphone")}
                  placeholder="(00) 00000-0000"
                />
                {errors.cellphone && (
                  <p className="text-sm text-red-500">
                    {errors.cellphone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email (opcional)
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="email@exemplo.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  Cidade *
                </label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Nome da cidade"
                />
                {errors.city && (
                  <p className="text-sm text-red-500">
                    {errors.city.message}
                  </p>
                )}
              </div>
            </div>

            {/* Endereço Completo */}
            <div className="space-y-2">
              <label
                htmlFor="completeAddress"
                className="text-sm font-medium"
              >
                Endereço Completo (opcional)
              </label>
              <Input
                id="completeAddress"
                {...register("completeAddress")}
                placeholder="Rua, número, bairro, complemento"
              />
              {errors.completeAddress && (
                <p className="text-sm text-red-500">
                  {errors.completeAddress.message}
                </p>
              )}
            </div>

            {/* URL da Imagem */}
            <div className="space-y-2">
              <label htmlFor="imgUrl" className="text-sm font-medium">
                URL da Imagem (opcional)
              </label>
              <Input
                id="imgUrl"
                {...register("imgUrl")}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {errors.imgUrl && (
                <p className="text-sm text-red-500">
                  {errors.imgUrl.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="text-white"
              >
                {isSubmitting ? "Atualizando..." : "Atualizar Fornecedor"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditSupplier;