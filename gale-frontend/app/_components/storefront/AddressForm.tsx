"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/_components/ui/input";
import { formatCep, isCompleteCep, lookupCep } from "@/api/cep";
import { CreateAddressPayload } from "@/api/user";

export const TYPE_ADDRESS_OPTIONS = [
  { value: "Street", label: "Rua" },
  { value: "Avanue", label: "Avenida" },
  { value: "Alley", label: "Beco" },
  { value: "Lane", label: "Travessa" },
  { value: "Highway", label: "Rodovia" },
  { value: "Road", label: "Estrada" },
  { value: "Square", label: "Praça" },
  { value: "Village", label: "Vila" },
  { value: "Condominium", label: "Condomínio" },
];

export interface AddressFormValue {
  typeAddress: string;
  address: string;
  number: string;
  district: string;
  complement: string;
  zipCode: string;
}

export const emptyAddress = (): AddressFormValue => ({
  typeAddress: TYPE_ADDRESS_OPTIONS[0].value,
  address: "",
  number: "",
  district: "",
  complement: "",
  zipCode: "",
});

// Rua, número e bairro são o mínimo pra entrega chegar.
export const isAddressComplete = (value: AddressFormValue): boolean =>
  value.address.trim() !== "" &&
  value.number.trim() !== "" &&
  value.district.trim() !== "";

export const toPayload = (value: AddressFormValue): CreateAddressPayload => ({
  typeAddress: value.typeAddress,
  address: value.address.trim(),
  number: value.number.trim(),
  district: value.district.trim(),
  complement: value.complement.trim() || undefined,
  zipCode: value.zipCode.trim() || undefined,
});

interface AddressFormProps {
  value: AddressFormValue;
  onChange: (value: AddressFormValue) => void;
}

const AddressForm = ({ value, onChange }: AddressFormProps) => {
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "found" | "notFound"
  >("idle");

  const set = (patch: Partial<AddressFormValue>) =>
    onChange({ ...value, ...patch });

  // Busca o CEP assim que os 8 dígitos são digitados. Achando, preenche
  // rua/tipo/bairro; não achando, deixa tudo pra pessoa escrever.
  const handleZipCodeChange = async (raw: string) => {
    const masked = formatCep(raw);
    set({ zipCode: masked });

    if (!isCompleteCep(masked)) {
      setCepStatus("idle");
      return;
    }

    setCepStatus("loading");
    const result = await lookupCep(masked);

    if (!result) {
      setCepStatus("notFound");
      return;
    }

    onChange({
      ...value,
      zipCode: masked,
      typeAddress: result.typeAddress ?? value.typeAddress,
      address: result.address || value.address,
      district: result.district || value.district,
    });
    setCepStatus("found");
  };

  return (
    <div className="space-y-2">
      {/* CEP primeiro: achando, já preenche rua e bairro */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="CEP"
          value={value.zipCode}
          onChange={(event) => handleZipCodeChange(event.target.value)}
          inputMode="numeric"
          className="w-32"
        />
        {cepStatus === "loading" && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Buscando...
          </span>
        )}
        {cepStatus === "found" && (
          <span className="text-xs text-green-600">Endereço preenchido</span>
        )}
        {cepStatus === "notFound" && (
          <span className="text-xs text-gray-400">
            CEP não encontrado — preencha abaixo
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={value.typeAddress}
          onChange={(event) => set({ typeAddress: event.target.value })}
          className="h-10 rounded-md border border-input bg-white px-2 text-sm"
        >
          {TYPE_ADDRESS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Endereço"
          value={value.address}
          onChange={(event) => set({ address: event.target.value })}
          className="col-span-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Número"
          value={value.number}
          onChange={(event) => set({ number: event.target.value })}
        />
        <Input
          placeholder="Bairro"
          value={value.district}
          onChange={(event) => set({ district: event.target.value })}
        />
      </div>

      <Input
        placeholder="Complemento (opcional)"
        value={value.complement}
        onChange={(event) => set({ complement: event.target.value })}
      />
    </div>
  );
};

export default AddressForm;
