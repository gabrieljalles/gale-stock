import { Button } from "@/_components/ui/button";
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import NewStock from "./_components/newStock";
import StockTransactionsTable from "./_components/StockTransactionsTable";
import { StockTransactionProvider } from "@/_store/stock/StockTransactionContext";
// import CreateStockPopup from "./CreateStockPopup";

const HistoryStockTab = () => {
  return (
    <StockTransactionProvider>
      <div className="flex h-full max-h-screen w-full flex-col space-y-4">
        <h2 className="text-md font-semibold">Histórico de compras</h2>

        {/* Functions */}
        <div>
          <NewStock />
        </div>

        {/* History */}
        <div className="flex">
          <StockTransactionsTable />
        </div>
      </div>
    </StockTransactionProvider>
  );
};

export default HistoryStockTab;
