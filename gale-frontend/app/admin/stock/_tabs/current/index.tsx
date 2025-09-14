import NewProductLoss from "./_components/newProductLoss";
import LostEntriesTable from "./_components/LostEntriesTable";
import { StockTransactionProvider } from "@/_store/stock/StockTransactionContext";

const CurrentStockTab = () => {
  return (
    <StockTransactionProvider>
      <div>
        {/* Title */}
        <div className="flex h-full max-h-screen w-full flex-col space-y-4">
          <h2 className="text-md font-semibold">Estoque de produtos</h2>
          {/* Funções */}
          <div>
            <NewProductLoss />
          </div>

          <div className="w-full">
            <h4 className="text-md mb-2">Histórico de perdas</h4>
            <div className="w-full">
              <LostEntriesTable />
            </div>
          </div>

          <div className="w-full">
            <h4 className="text-md mb-2">Estoque</h4>
            <div className="w-full">
              <LostEntriesTable />
            </div>
          </div>
        </div>
      </div>
    </StockTransactionProvider>
  );
};

export default CurrentStockTab;
