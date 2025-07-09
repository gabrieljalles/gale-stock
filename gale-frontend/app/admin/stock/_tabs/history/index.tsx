import { Button } from "@/_components/ui/button";
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import NewStock from "./_components/newStock";
// import CreateStockPopup from "./CreateStockPopup";

const HistoryStockTab = () => {
  const [showNewStockPopup, setShowNewStockPop] = useState<boolean>(false);
  return (
    <div className="flex h-full max-h-screen w-full flex-col space-y-4">
      <h2 className="text-md font-semibold">Histórico de estoque</h2>

      {/* Functions */}
      <div>
        <NewStock/> 
      </div>

      {/* Popup modal Adicionar estoque
      {showNewStockPopup && (
        // <CreateStockPopup setShowNewStockPopup={undefined} />
      )} */}
    </div>
  );
};

export default HistoryStockTab;
