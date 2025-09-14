"use client";
import { Skeleton } from "@/_components/ui/skeleton";
import { useProducts } from "@/_store/products/ProductContext";
import ProductCard from "./_components/ProductCard";
import { useEffect, useState } from "react";
import Filter from "../../../_components/filter";
import NewProduct from "../../_components/newProduct";
import { deleteProduct } from "@/api/product";
import { translateCategory } from "@/_constants";

const ProductsTab = () => {
  const { products, loading, error, refresh, removeProduct } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products ?? []);

  useEffect(() => {
    setFilteredProducts(products ?? []);
  }, [products]);

  return (
    <div className="flex h-full max-h-screen w-full flex-col space-y-4">
      <h2 className="text-md font-semibold">Produtos cadastrados</h2>

      {/* Functions */}
      <div>
        <NewProduct />
      </div>

      {/* Search */}
      <Filter
        data={products || []}
        onFilter={setFilteredProducts}
        searchField="name"
        categoryField="category"
        searchPlaceholder="Buscar por nome..."
        categoryTranslator={translateCategory}
        categoryPlaceholder="Todas as categorias"
      />

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {" "}
        {loading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="text-destructive">
            Ocorreu um erro ao carregar os produtos.
            <button className="ml-2 underline" onClick={refresh}>
              Tentar novamente
            </button>
          </div>
        )}
        {/* Lista de Produtos */}
        <div className="min-h-0 flex-1">
          <div className="grid max-h-[72vh] gap-3 overflow-y-auto pb-3 pr-2 md:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={async (id) => {
                  await deleteProduct(id);
                  removeProduct(id);
                }}
              />
            ))}
          </div>
        </div>
        {/* Caso não haja produtos */}
        {!loading && products?.length === 0 && (
          <div className="text-muted-foreground">
            Nenhum produto em estoque.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTab;
