import { ProductProps } from "@/_types";
import { Card, CardContent } from "@/_components/ui/card";
import { translateCategory } from "@/_constants/product";
import Image from "next/image";
import { Button } from "@/_components/ui/button";
import { Pen, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import EditProduct from "./EditProduct";

interface ProductCardProps {
  product: ProductProps;
  onDelete: (id: string) => void;
}

const ProductCard = ({ product, onDelete }: ProductCardProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Excluir ${product.name}? Esta ação não pode ser desfeita.`)) {
      const fileKey = product.imgUrl.split("/").pop();

      if (fileKey) {
        try {
          await fetch("/api/uploadthing", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey }),
          });
          toast.success("Imagem excluída com sucesso!");
        } catch (error) {
          console.error("Erro ao excluir imagem do uploadthing:", error);
        }
      }
      onDelete(product.id);
    }
  };

  return (
    <Card
      key={product.id}
      className="flex items-start gap-2 rounded-t-md bg-white p-0 pb-3"
    >
      <CardContent className="flex w-full flex-col gap-2 p-0">
        {/* Category */}
        <div className="flex w-full items-center justify-center rounded-md bg-gray-100 p-1 px-1 text-sm text-gray-400">
          <span className="flex flex-1 items-center justify-center">
            {translateCategory(product.category)}
          </span>

          {/* Options */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="h-1 w-1 p-3 hover:bg-primary hover:text-white"
            >
              <Pen />
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-1 w-1 p-3 hover:bg-primary"
            >
              <X />
            </Button>
          </div>
        </div>

        {/* title */}
        <div className="flex items-center gap-4 p-3">
          <Image
            src={product.imgUrl}
            width={36}
            height={36}
            alt={product.name}
            className="rounded-md border bg-slate-50 object-contain"
          />
          <div className="text-justify text-sm font-bold">{product.name}</div>
        </div>

        <div className="text-muted-foreground px-3 text-sm">
          {product.description}
        </div>
      </CardContent>

      <EditProduct
        product={product}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
};

export default ProductCard;
