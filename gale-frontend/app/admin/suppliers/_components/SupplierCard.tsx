import { SupplierProps } from "@/_types";
import { Card, CardContent } from "@/_components/ui/card";
import Image from "next/image";
import { Button } from "@/_components/ui/button";
import { Pen, X } from "lucide-react";

interface SupplierCardProps {
  supplier: SupplierProps;
  onDelete: (id: string) => void;
}

const SupplierCard = ({ supplier, onDelete }: SupplierCardProps) => {
  const handleDelete = async () => {
    if (
      confirm(
        `Excluir ${supplier.enterprise}? Esta ação não pode ser desfeita.`,
      )
    ) {
      const fileKey = supplier.imgUrl.split("/").pop();

      if (fileKey) {
        try {
          await fetch("/api/uploadthing", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey }),
          });
        } catch (error) {
          console.error("Erro ao excluir imagem do uploadthing:", error);
        }
      }
      onDelete(supplier.id);
    }
  };

  return (
    <Card
      key={supplier.id}
      className="flex items-start gap-2 rounded-t-md p-0 pb-3"
    >
      <CardContent className="flex w-full flex-col gap-2 p-0">
        {/* Title */}
        <div className="flex w-full items-center justify-center rounded-md bg-slate-50 p-1 px-1 text-sm">
          <div className="flex flex-1 items-center gap-2">
            <Image
              src={supplier.imgUrl}
              width={36}
              height={36}
              alt={supplier.enterprise}
              className="rounded-md border bg-slate-50 object-contain"
            />
            <h3 className="flex-1 items-center justify-center text-sm font-bold">
              {supplier.enterprise}
            </h3>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-1 w-1 p-3 hover:bg-primary"
            >
              <X />
            </Button>
          </div>
        </div>

        {/* Informations*/}
        <div className="flex items-center gap-4 p-3">
          <div className="text-justify text-sm font-bold">
            {supplier.enterprise}
          </div>
        </div>

        <div className="text-muted-foreground px-3 text-sm">
          {supplier.enterprise}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierCard;
