"use client";
import SideBar from "@/admin/_components/SideBar";
import CurrentStockTab from "./_tabs/current/";
import HistoryStockTab from "./_tabs/history/";
import ProductsTab from "./_tabs/products/";
import { useState } from "react";
import TabButton from "../_components/TabButton";
import SuppliersStockTab from "./_tabs/suppliers";
const tabs = [
  {
    label: "Em estoque",
    value: "current",
    component: <CurrentStockTab />,
  },
  {
    label: "Histórico",
    value: "history",
    component: <HistoryStockTab />,
  },
  {
    label: "Produtos",
    value: "products",
    component: <ProductsTab />,
  },
  {
    label: "Fornecedores",
    value: "suppliers",
    component: <SuppliersStockTab />,
  },
];

const StockPage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const currentTab = tabs.find((tab) => tab.value === activeTab);

  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white p-1">
        {/* Navigation */}
        <nav className="flex flex-shrink-0 overflow-x-auto border-b">
          {tabs.map((tab) => (
            <TabButton
              key={tab.value}
              isActive={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </TabButton>
          ))}
        </nav>

        <div className="w-full flex-1 overflow-hidden rounded-md bg-gray-50 p-3">
          {currentTab?.component}
        </div>
      </div>
    </div>
  );
};

export default StockPage;
