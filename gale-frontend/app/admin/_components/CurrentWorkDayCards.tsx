"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/_components/ui/card";
import {
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  Receipt,
  Bike,
} from "lucide-react";
import { useWorkDay } from "@/_store/workDay/WorkDayContext";

// Mesma altura do gráfico de mais vendidos e do aviso de vencidos,
// pra ficarem alinhados na mesma linha.
const CONTAINER_HEIGHT = 208;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining}min`;
  return `${hours}h${remaining.toString().padStart(2, "0")}`;
};

const CurrentWorkDayCards = () => {
  const { workDays, storeOpen, loading } = useWorkDay();
  const [now, setNow] = useState(() => Date.now());

  const currentDay = workDays.find((wd) => wd.isOpen) ?? null;

  // Mantém a duração "ao vivo" enquanto o dia estiver aberto.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !storeOpen || !currentDay) return null;

  const elapsedMinutes = Math.round(
    (now - new Date(currentDay.openedAt).getTime()) / 60000,
  );

  const cards = [
    {
      label: "Duração",
      value: formatDuration(elapsedMinutes),
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Pedidos",
      value: String(currentDay.orderCount),
      icon: Package,
      color: "text-gray-700",
    },
    {
      label: "Faturamento",
      value: formatCurrency(currentDay.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Entregas",
      value: formatCurrency(currentDay.totalFreightRevenue),
      icon: Bike,
      color: "text-orange-600",
    },
    {
      label: "Lucro",
      value: formatCurrency(currentDay.totalProfit),
      icon: TrendingUp,
      color: currentDay.totalProfit >= 0 ? "text-blue-600" : "text-red-600",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(currentDay.averageTicket),
      icon: Receipt,
      color: "text-gray-700",
    },
  ];

  return (
    <div
      className="w-full flex-shrink-0 sm:w-auto"
      style={{ height: CONTAINER_HEIGHT }}
    >
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-2 sm:w-[340px] sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="h-full py-0">
            <CardContent className="flex h-full flex-col justify-center gap-0.5 px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Icon className="h-3 w-3" />
                {label}
              </div>
              <span className={`text-sm font-bold ${color}`}>{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CurrentWorkDayCards;
