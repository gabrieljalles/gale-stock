import { SupplierProps } from "@/_types";
import { Card, CardContent } from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { Pen, X, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import EditSupplier from "./EditSupplier";

interface SupplierCardProps {
  supplier: SupplierProps;
  onDelete: (id: string) => void;
}

const SupplierCard = ({ supplier, onDelete }: SupplierCardProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (
      confirm(
        `Excluir fornecedor ${supplier.enterprise}? Esta ação não pode ser desfeita.`,
      )
    ) {
      try {
        // A função onDelete agora é responsável por chamar a API
        await onDelete(supplier.id);
        toast.success("Fornecedor excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir fornecedor:", error);
        toast.error("Erro ao excluir fornecedor. Tente novamente.");
      }
    }
  };

  const handleEdit = () => {
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  return (
    <>
      <Card className="flex items-start gap-2 rounded-md bg-white p-0 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="flex w-full flex-col gap-3 p-0">
          {/* Header com nome da empresa e ações */}
          <div className="flex w-full items-center justify-between rounded-t-md bg-gray-100 p-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-600" />
              <span className="truncate font-semibold text-gray-900">
                {supplier.enterprise}
              </span>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                onClick={handleEdit}
                className="h-8 w-8 p-0 hover:bg-gray-200"
                title="Editar fornecedor"
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                title="Excluir fornecedor"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Informações principais */}
          <div className="flex items-start gap-4 px-3">
            <div className="flex-shrink-0">
              {supplier.imgUrl ? (
                <img
                  src={supplier.imgUrl}
                  width={64}
                  height={64}
                  alt={supplier.enterprise}
                  className="rounded-lg border bg-slate-50 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-slate-50">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold text-gray-900">
                {supplier.legalRepresentative}
              </div>
              {supplier.appName && (
                <div className="mb-2 text-sm text-gray-600">
                  CPF/CNPJ: {supplier.appName}
                </div>
              )}

              {/* Informações de contato */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{supplier.cellphone}</span>
                </div>

                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{supplier.city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço completo - só mostra se existir */}
          {supplier.completeAddress && (
            <div className="px-3 pb-3">
              <div className="rounded bg-gray-50 p-2 text-sm text-gray-500">
                <strong>Endereço:</strong> {supplier.completeAddress}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <EditSupplier
        supplier={supplier}
        open={editOpen}
        onClose={handleCloseEdit}
      />
    </>
  );
};

export default SupplierCard;
