import ProductOnStockCard from "./_components/productOnStockCard";
import ValidityLegend from "./_components/ValidityLegend";
import ExpiringProductsWidget from "./_components/ExpiringProductsWidget";
import { StockTransactionProvider } from "@/_store/stock/StockTransactionContext";

const CurrentStockTab = () => {
  return (
    <StockTransactionProvider>
      <div className="flex h-full w-full flex-col rounded p-1">
        {/* Funções e Legenda */}
        <div className="mb-1.5 flex flex-shrink-0 flex-col items-start justify-between gap-1.5 sm:flex-row">
          <ExpiringProductsWidget />
        </div>

        {/* Área de Conteúdo - Componente com rolagem */}
        <div className="min-h-0 flex-1">
          <ProductOnStockCard />
        </div>
      </div>
    </StockTransactionProvider>
  );
};

export default CurrentStockTab;
