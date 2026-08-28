"use client";

import SideBar from "@/admin/_components/SideBar";
import { Wallet } from "lucide-react";

const FinanceiroPage = () => {
  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 overflow-y-auto rounded-md border border-black bg-white p-4">
        <Wallet className="h-10 w-10 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">
          Essa aba ainda não tem conteúdo definido.
        </p>
      </div>
    </div>
  );
};

export default FinanceiroPage;
