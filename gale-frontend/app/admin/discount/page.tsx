"use client";

import { useState } from "react";
import SideBar from "@/admin/_components/SideBar";
import TabButton from "../_components/TabButton";
import PointsTab from "./_tabs/points";
import { Percent } from "lucide-react";

const tabs = [
  {
    label: "Pontos",
    value: "points",
    component: <PointsTab />,
  },
];

const DiscountPage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const currentTab = tabs.find((tab) => tab.value === activeTab);

  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white">
        <header className="flex-shrink-0 border-b bg-white">
          <div className="px-6 py-4">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Percent className="h-6 w-6" />
              Promoções
            </h1>
            <p className="text-gray-600">
              Programa de fidelidade e regras de desconto da loja
            </p>
          </div>
        </header>

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

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {currentTab?.component}
        </main>
      </div>
    </div>
  );
};

export default DiscountPage;
