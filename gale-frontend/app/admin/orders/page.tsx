"use client";

import SideBar from "@/admin/_components/SideBar";
import OrdersKanbanBoard from "../_components/OrdersKanbanBoard";
import { Truck } from "lucide-react";

const OrdersKanbanPage = () => {
  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white">
        <header className="flex-shrink-0 border-b px-6 py-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Truck className="h-6 w-6" />
            Pedidos
          </h1>
          <p className="text-gray-600">
            Acompanhamento de pedidos de delivery — vendas de balcão não
            passam por aqui.
          </p>
        </header>

        <main className="flex-1 overflow-hidden p-4">
          <OrdersKanbanBoard heightClassName="h-full" />
        </main>
      </div>
    </div>
  );
};

export default OrdersKanbanPage;
