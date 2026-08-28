"use client";

import { useState } from "react";
import SideBar from "@/admin/_components/SideBar";
import TabButton from "../_components/TabButton";
import CatalogProductsTab from "./_tabs/products";
import { CatalogProvider } from "@/_store/catalog/CatalogContext";

const tabs = [
  {
    label: "Produtos",
    value: "products",
    component: <CatalogProductsTab />,
  },
];

const CatalogPage = () => {
  const [activeTab, setActiveTab] = useState("products");

  const currentTab = tabs.find((tab) => tab.value === activeTab);

  return (
    <CatalogProvider>
      <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
        <SideBar />

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white">
          {/* Header */}
          <header className="flex-shrink-0 border-b bg-white">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
              <p className="text-gray-600">
                Gerencie preços e disponibilidade dos produtos
              </p>
            </div>
          </header>

          {/* Tabs */}
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

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {currentTab?.component}
          </main>
        </div>
      </div>
    </CatalogProvider>
  );
};

export default CatalogPage;
