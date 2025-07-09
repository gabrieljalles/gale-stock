import { ProductProps } from "@/api/product";
import { Card, CardContent } from "@/_components/ui/card";
import { translateCategory } from "@/_constants/product";
import Image from "next/image";
import { Button } from "@/_components/ui/button";
import { Pen, X } from "lucide-react";
import { deleteFile } from "@/_utils/deleteFile";


interface ProductCardProps {
  product: ProductProps;
  onDelete: (id: string) => void;
}

const ProductCard = ({ product, onDelete }: ProductCardProps) => {

  const handleDelete = async () => {

      if (confirm(`Excluir ${product.name}? Esta ação não pode ser desfeita.`)) {
        const fileKey = product.imgUrl.split("/").pop();

        if (fileKey){
          try {
            await fetch("/api/uploadthing", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileKey }),
            });
          }catch (error) {
            console.error("Erro ao excluir imagem do uploadthing:", error);
          }
        }
        onDelete(product.id);
    }
  }

  return (
    <Card
      key={product.id}
      className="flex items-start gap-2 rounded-t-md p-0 pb-3"
    >
      <CardContent className="flex w-full flex-col gap-2 p-0">
        {/* Category */}
        <div className="flex  items-center w-full justify-center rounded-md bg-slate-50 p-1 text-sm px-1 text-gray-400">
          <span className="flex flex-1 justify-center items-center">{translateCategory(product.category)}</span>
          
          {/* Options */}
          <div className="flex gap-1">
            {/* <Button variant="ghost" className="w-1 h-1 p-3 cursor-none disabled"><Pen/></Button> */}
            <Button variant="outline" onClick={handleDelete} className="w-1 h-1 p-3 hover:bg-primary"><X/></Button>
          </div>
        </div>

        {/* title */}
        <div className="flex items-center gap-4 p-3">
          <Image
            src={product.imgUrl}
            width={36}
            height={36}
            alt={product.name}
            className="rounded-md border bg-slate-50 object-cover p-1"
          />
          <div className="text-justify text-sm font-bold">{product.name}</div>
        </div>

        <div className="text-muted-foreground px-3 text-sm">
          {product.description}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
