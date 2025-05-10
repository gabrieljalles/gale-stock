"use client";
import SideBar from "@/admin/_components/SideBar";
import CreateStockPopup from "../_components/CreateStockPopup";

const StockPage = () => {
  return (
    <div className="flex min-h-screen w-full p-3">
      <SideBar />
      <CreateStockPopup />
      {/* <main className="flex p-2">ola mundo</main> */}
    </div>
  );
};

export default StockPage;
