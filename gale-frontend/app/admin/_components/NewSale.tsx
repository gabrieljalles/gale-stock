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
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { CirclePlus } from "lucide-react";

// Renomear para o cliente
const deliveryTypes = [
  { value: "InStore", label: "Na loja" },
  { value: "Delivery", label: "Delivery" },
];

const channelOptions = [
  { value: "Whatsapp", label: "Whatsapp" },
  { value: "Instagram", label: "Instagram" },
  { value: "Call", label: "Ligação" },
  { value: "Ifood", label: "Ifood" },
];

const schema = z.object({
  deliveryType: z.enum(["InStore", "Delivery"], {
    required_error: "Tipo de entrega é obrigatório",
  }),
  channel: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const NewSale = () => {
  const [open, setOpen] = useState(false);
  const methods = useForm<FormData>({
    defaultValues: {
      deliveryType: "InStore",
    },
  });
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = methods;

  const deliveryType = useWatch({
    control,
    name: "deliveryType",
  });

  const onSubmit = (data: FormData) => {
    const finalData = {
      ...data,
      channel: data.deliveryType === "InStore" ? "Local" : data.channel,
    };

    // Enviar para API
    setOpen(false);
    reset();
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="hover:bg-green-500 hover:text-white"
      >
        <CirclePlus />
        Nova venda
      </Button>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="fixed right-0 top-0 flex h-screen w-full max-w-[360px] flex-col rounded-md border-l bg-white shadow-lg">
          <DrawerHeader>
            <DrawerTitle>Nova Venda</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" className="absolute right-2 top-2">
                X
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
            >
              {/* Tipo de entrega */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Tipo de entrega
                </label>
                <Controller
                  name="deliveryType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectGroup>
                          {deliveryTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.deliveryType && (
                  <span className="text-xs text-red-500">
                    {errors.deliveryType.message}
                  </span>
                )}
              </div>

              {/* Campo Canal (só aparece se for Delivery) */}
              {deliveryType === "Delivery" && (
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Canal de venda
                  </label>
                  <Controller
                    name="channel"
                    control={control}
                    rules={{
                      required:
                        deliveryType === "Delivery"
                          ? "Canal é obrigatório"
                          : false,
                    }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o canal..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectGroup>
                            {channelOptions.map((ch) => (
                              <SelectItem key={ch.value} value={ch.value}>
                                {ch.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.channel && (
                    <span className="text-xs text-red-500">
                      {errors.channel.message}
                    </span>
                  )}
                </div>
              )}

              {/* (Outros campos virão aqui depois) */}

              <div className="flex gap-2 border-t p-4">
                <Button
                  type="submit"
                  className="flex-1 text-white hover:bg-green-500"
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-white hover:border-red-500 hover:text-red-500"
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

export default NewSale;
