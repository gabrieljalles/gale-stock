"use client";
import SideBar from "@/admin/_components/SideBar";
import { useState } from "react";
import TabButton from "../_components/TabButton";
import SuppliersTab from "./_tabs/supplier";
const tabs = [
  {
    label: "Fornecedores",
    value: "supplier",
    component: <SuppliersTab />,
  },
  // {
  //   label: "Histórico",
  //   value: "history",
  //   component: <HistorySupplierTab />,
  // },
];

const SupplierPage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const currentTab = tabs.find((tab) => tab.value === activeTab);

  return (
    <div className="flex h-screen w-full gap-1 p-1">
      <SideBar />

      {/* Content */}
      <div className="flex-1 rounded-md border border-black bg-white p-1">
        {/* Navigation */}
        <nav className="flex border-b">
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

        <div className="flex h-full w-full rounded-md p-3">
          {currentTab?.component}
        </div>
      </div>
    </div>
  );
};

export default SupplierPage;
