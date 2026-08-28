"use client";

import { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import { useSuppliers } from "@/_store/supplier/SupplierContext";
import SupplierCard from "./SupplierCard";
import { normalize } from "@/_utils/normalize-string";

const SuppliersGrid = () => {
  const { suppliers, loading, error, removeSupplier } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar fornecedores baseado na busca
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;

    const normalizedSearch = normalize(searchTerm);

    return suppliers.filter((supplier) => {
      const searchableText = [
        supplier.enterprise,
        supplier.legalRepresentative,
        supplier.appName,
        supplier.email,
        supplier.cellphone,
        supplier.city,
        supplier.completeAddress,
      ].join(" ");

      return normalize(searchableText).includes(normalizedSearch);
    });
  }, [suppliers, searchTerm]);

  const handleDeleteSupplier = async (id: string) => {
    try {
      await removeSupplier(id);
    } catch (error) {
      // O erro já é tratado no Context, mas podemos adicionar log aqui se necessário
      console.error("Erro ao deletar fornecedor:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-500">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erro ao carregar fornecedores:</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Controles superiores */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Busca */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contador */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>
            {filteredSuppliers.length} de {suppliers.length} fornecedores
          </span>
        </div>
      </div>

      {/* Grid de fornecedores */}
      <div className="flex-1 overflow-y-auto">
        {filteredSuppliers.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              {searchTerm ? (
                <>
                  <p className="font-medium text-gray-500">
                    Nenhum fornecedor encontrado
                  </p>
                  <p className="text-sm text-gray-400">
                    Tente ajustar os termos da busca
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-500">
                    Nenhum fornecedor cadastrado
                  </p>
                  <p className="text-sm text-gray-400">
                    Clique em "Novo Fornecedor" para começar
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onDelete={handleDeleteSupplier}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersGrid;
