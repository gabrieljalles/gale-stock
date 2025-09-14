"use client";
import { Skeleton } from "@/_components/ui/skeleton";
import { useEffect, useState } from "react";
import { deleteProduct } from "@/api/product";
import { useSuppliers } from "@/_store/supplier/SupplierContext";
import NewSupplier from "../../_components/NewSupplier";
import Filter from "@/admin/_components/filter";
import SupplierCard from "../../_components/SupplierCard";

const SuppliersTab = () => {
  const { suppliers, loading, error, refresh, removeSupplier } = useSuppliers();
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers ?? []);

  useEffect(() => {
    setFilteredSuppliers(suppliers ?? []);
  }, [suppliers]);

  return (
    <div className="flex h-full max-h-screen w-full flex-col space-y-4">
      <h2 className="text-md font-semibold">Fornecedores cadastrados</h2>

      {/* Functions */}
      <div>
        <NewSupplier />
      </div>

      {/* Search */}
      <Filter
        data={suppliers || []}
        onFilter={setFilteredSuppliers}
        searchField="enterprise"
        searchPlaceholder="Buscar por empresa..."
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
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onDelete={async (id) => {
                  await deleteProduct(id);
                  removeSupplier(id);
                }}
              />
            ))}
          </div>
        </div>
        {/* Caso não haja fornecedores */}
        {!loading && suppliers?.length === 0 && (
          <div className="text-muted-foreground">
            Nenhum fornecedor cadastrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersTab;
