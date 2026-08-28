"use client";
import { Controller, useFormContext } from "react-hook-form";
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
} from "@/_constants/product";
import { Input } from "@/_components/ui/input";
import ImageUploadInput from "./imageUploadInput";

interface ProductFormFieldsProps {
  mode: "create" | "edit";
}

const ProductFormFields = ({ mode }: ProductFormFieldsProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();

  const handleBarCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Leitores de código de barras costumam "digitar" o código e enviar Enter
    // no final. Evita que isso submeta o formulário sem querer.
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <>
      {/* Nome */}
      <div>
        <label className="mb-0.5 block text-xs font-bold">Nome</label>
        {mode === "create" ? (
          <NameInputAutocomplete {...register("name")} />
        ) : (
          <Input type="text" {...register("name")} />
        )}
        {errors.name && (
          <span className="text-xs text-red-500">
            {errors.name.message as string}
          </span>
        )}
      </div>

      {/* Categoria */}
      <div>
        <label className="mb-0.5 block text-xs font-bold">Categoria</label>
        <Controller
          name="category"
          control={control}
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
            {errors.category.message as string}
          </span>
        )}
      </div>

      {/* Código de barras */}
      <div>
        <label className="mb-0.5 block text-xs font-bold">
          Código de barras
        </label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Use o leitor ou digite o código"
          {...register("barCode")}
          onKeyDown={handleBarCodeKeyDown}
        />
        {errors.barCode && (
          <span className="text-xs text-red-500">
            {errors.barCode.message as string}
          </span>
        )}
      </div>

      {/* Descrição */}
      <div>
        <label className="mb-0.5 block text-xs font-bold">Descrição</label>
        <textarea
          {...register("description")}
          className="min-h-[48px] w-full resize-y rounded border p-1.5 text-sm"
          placeholder="Descreva o produto"
        />
        {errors.description && (
          <span className="text-xs text-red-500">
            {errors.description.message as string}
          </span>
        )}
      </div>

      {/* Tipo / Tamanho / Pack lado a lado */}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="mb-0.5 block text-xs font-bold">Tipo</label>
          <Controller
            name="sizeType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full px-2">
                  <SelectValue placeholder="Tipo" />
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
            <span className="text-xs text-red-500">Obrigatório</span>
          )}
        </div>

        <div>
          <label className="mb-0.5 block text-xs font-bold">Tamanho</label>
          <Input type="text" {...register("size")} placeholder="310" />
          {errors.size && (
            <span className="text-xs text-red-500">Inválido</span>
          )}
        </div>

        <div>
          <label className="mb-0.5 block text-xs font-bold">Pack</label>
          <Input type="text" {...register("pack")} placeholder="12" />
          {errors.pack && (
            <span className="text-xs text-red-500">Inválido</span>
          )}
        </div>
      </div>

      {/* img */}
      <div>
        <Controller
          name="imgUrl"
          control={control}
          render={({ field }) => (
            <ImageUploadInput value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.imgUrl && (
          <span className="text-xs text-red-500">
            {errors.imgUrl.message as string}
          </span>
        )}
      </div>
    </>
  );
};

export default ProductFormFields;
