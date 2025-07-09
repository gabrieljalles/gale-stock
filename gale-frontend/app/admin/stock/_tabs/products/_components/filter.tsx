import { useEffect, useState } from "react";
import { useProducts } from "@/_store/products/ProductContext";
import { ProductProps } from "@/api/product";
import { translateCategory } from "@/_constants/product";
import { normalize } from "@/_utils/normalize-string";
import { Button } from "@/_components/ui/button";
interface FilterProps {
  onFilter: (products: ProductProps[]) => void;
}

export default function Filter({ onFilter }: FilterProps) {
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = Array.from(
    new Set(products?.map((p) => p.category) || []),
  );

  const handleFilter = () => {
    if (!products) return onFilter([]);
    let filtered = products;

    if (search)
      filtered = filtered.filter((p) =>
        normalize(p.name).includes(normalize(search)),
      );
    if (category) filtered = filtered.filter((p) => p.category === category);
    onFilter(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [search, category, products]);

  return (
    <div className="mb-4 flex w-full flex-col gap-2">
      <div className="flex w-full gap-2">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border p-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border p-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {translateCategory(c)}
            </option>
          ))}
        </select>
        <Button
          onClick={() => {
            setSearch("");
            setCategory("");
            onFilter(products ?? []);
          }}
          className="rounded border px-3 py-2 text-sm text-white hover:border-secondary hover:text-secondary"
        >
          Limpar
        </Button>
      </div>
    </div>
  );
}
