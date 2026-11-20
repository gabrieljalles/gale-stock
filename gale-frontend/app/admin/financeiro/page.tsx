"use client";

import { useContext, useState } from "react";
import SideBar from "@/admin/_components/SideBar";
import TabButton from "../_components/TabButton";
import { AuthContext } from "@/_store/auth/AuthContext";
import DreTab from "./_tabs/dre";
import ExpensesTab from "./_tabs/expenses";

const tabs = [
  { label: "DRE", value: "dre", component: <DreTab /> },
  { label: "Despesas fixas", value: "expenses", component: <ExpensesTab /> },
];

const FinanceiroPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const currentTab = tabs.find((tab) => tab.value === activeTab);

  // Apuração é dado da empresa: as rotas já exigem Admin no servidor, e a
  // tela acompanha pra não mostrar um erro em vez de uma explicação.
  if (user && user.role !== "Admin") {
    return (
      <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
        <SideBar />
        <div className="flex flex-1 items-center justify-center rounded-md border border-black bg-white">
          <p className="text-sm text-gray-500">
            Apenas o administrador tem acesso ao Financeiro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white p-1">
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

export default FinanceiroPage;
