import { CatalogItem } from "@/api/catalog";
import { CatalogCard } from "./CatalogCard";
import { useState } from "react";
import { Input } from "@/_components/ui/input";
import { Search } from "lucide-react";

interface CatalogGridProps {
  items: CatalogItem[];
}

export const CatalogGrid = ({ items }: CatalogGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar produtos no catálogo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de produtos */}
      {filteredItems.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto no catálogo"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};