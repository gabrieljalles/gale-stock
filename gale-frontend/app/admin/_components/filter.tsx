import { useEffect, useState } from "react";
import { normalize } from "@/_utils/normalize-string";
import { Button } from "@/_components/ui/button";

interface FilterProps<T> {
  data: T[];
  onFilter: (items: T[]) => void;
  categoryField?: keyof T;
  searchField: keyof T;
  searchPlaceholder?: string;
  categoryTranslator?: (value: string) => string;
  categoryPlaceholder?: string;
}

const Filter = <T,>({
  data,
  onFilter,
  categoryField,
  searchField,
  searchPlaceholder = "Buscar...",
  categoryTranslator,
  categoryPlaceholder = "Todas as categorias",
}: FilterProps<T>) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = categoryField
    ? Array.from(
        new Set(data?.map((item) => String(item[categoryField])) || []),
      )
    : [];

  const handleFilter = () => {
    if (!data) return onFilter([]);
    let filtered = data;

    // Filtro de busca genérico
    if (search) {
      filtered = filtered.filter((item) =>
        normalize(String(item[searchField])).includes(normalize(search)),
      );
    }

    // Filtro de categoria genérico
    if (category && categoryField) {
      filtered = filtered.filter(
        (item) => String(item[categoryField]) === category,
      );
    }

    onFilter(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [search, category, data]);

  return (
    <div className="mb-4 flex w-full flex-col gap-2">
      <div className="flex w-full gap-2">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border p-2 text-sm"
        />

        {/* Só mostrar o select se houver categoryField */}
        {categoryField && categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border p-2 text-sm"
          >
            <option value="">{categoryPlaceholder}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryTranslator ? categoryTranslator(c) : c}
              </option>
            ))}
          </select>
        )}

        <Button
          onClick={() => {
            setSearch("");
            setCategory("");
            onFilter(data ?? []);
          }}
          className="rounded border px-3 py-2 text-sm text-white hover:border-secondary hover:text-secondary"
        >
          Limpar
        </Button>
      </div>
    </div>
  );
};

export default Filter;
