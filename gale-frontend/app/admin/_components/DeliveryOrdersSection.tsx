"use client";

import { useWorkDay } from "@/_store/workDay/WorkDayContext";
import OrdersKanbanBoard from "./OrdersKanbanBoard";
import { KanbanOrderStatus } from "@/api/order";

interface DeliveryOrdersSectionProps {
  // Quais colunas mostrar (default: todas) — permite colocar o "Entregue"
  // separado do resto do quadro.
  columns?: KanbanOrderStatus[];
  heightClassName?: string;
}

// Só aparece (e só é possível interagir) com a loja aberta — pedido de
// delivery não faz sentido ser trabalhado com a loja fechada.
const DeliveryOrdersSection = ({
  columns,
  heightClassName,
}: DeliveryOrdersSectionProps) => {
  const { storeOpen, loading } = useWorkDay();

  if (loading) return null;

  return (
    <div className={heightClassName ? "h-full" : undefined}>
      {storeOpen ? (
        <OrdersKanbanBoard
          compact
          // O Resumo é a visão do dia: entregas de dias anteriores não
          // pertencem a ele. Na aba Pedidos o histórico segue inteiro.
          todayOnly
          columns={columns}
          heightClassName={heightClassName}
        />
      ) : (
        <p className="rounded-md border border-dashed bg-gray-50 p-4 text-center text-xs text-gray-400">
          A loja está fechada. Os pedidos de delivery aparecem aqui quando ela
          abrir.
        </p>
      )}
    </div>
  );
};

export default DeliveryOrdersSection;
