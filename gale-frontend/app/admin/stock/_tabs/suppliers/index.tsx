import { SupplierProvider } from "@/_store/supplier/SupplierContext";
import NewSupplier from "./_components/NewSupplier";
import SuppliersGrid from "./_components/SuppliersGrid";

const SuppliersStockTab = () => {
  return (
    <SupplierProvider>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex min-h-0 flex-1 flex-col space-y-4 p-1">
          <h2 className="text-lg flex-shrink-0 font-semibold">
            Gerenciar Fornecedores
          </h2>

          {/* Botão de criar novo fornecedor */}
          <div className="flex flex-shrink-0 flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-600">
              Gerencie os fornecedores da sua empresa
            </p>
            <NewSupplier />
          </div>

          {/* Grid de fornecedores */}
          <div className="flex min-h-0 flex-1 flex-col">
            <SuppliersGrid />
          </div>
        </div>
      </div>
    </SupplierProvider>
  );
};

export default SuppliersStockTab;
