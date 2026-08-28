import LostEntriesTable from "./_components/LostEntriesTable";
import NewProductLoss from "./_components/newProductLoss";
import NewStock from "./_components/newStock";
import StockTransactionsTable from "./_components/StockTransactionsTable";
import { StockTransactionProvider } from "@/_store/stock/StockTransactionContext";

const HistoryStockTab = () => {
  return (
    <StockTransactionProvider>
      <div className="flex h-full w-full flex-col space-y-4 overflow-hidden">
        {/* Functions */}
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <NewStock />
          <NewProductLoss />
        </div>

        <div className="flex-shrink-0">
          <h4 className="text-md mb-2">Histórico de perdas</h4>
          <div className="max-h-32 w-full overflow-y-auto">
            <LostEntriesTable />
          </div>
        </div>

        {/* History */}
        <div className="flex min-h-0 flex-1 flex-col">
          <h4 className="text-md mb-2 flex-shrink-0">Histórico de estoque</h4>
          <div className="min-h-0 flex-1">
            <StockTransactionsTable />
          </div>
        </div>
      </div>
    </StockTransactionProvider>
  );
};

export default HistoryStockTab;
