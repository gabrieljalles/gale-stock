"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Package,
  DollarSign,
  TrendingUp,
  Receipt,
  Bike,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { getWorkDays, WorkDayReport } from "@/api/workDay";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const currentYear = new Date().getFullYear();

const FinanceSummaryCards = () => {
  const [workDays, setWorkDays] = useState<WorkDayReport[] | null>(null);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    getWorkDays()
      .then(setWorkDays)
      .catch(() => toast.error("Erro ao carregar o resumo financeiro."));
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    (workDays ?? []).forEach((wd) =>
      years.add(new Date(wd.openedAt).getFullYear()),
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [workDays]);

  const cards = useMemo(() => {
    if (!workDays) return null;

    const filtered = workDays.filter(
      (wd) => new Date(wd.openedAt).getFullYear() === year,
    );

    const totalDays = filtered.length;
    const totalOrders = filtered.reduce((sum, wd) => sum + wd.orderCount, 0);
    const totalRevenue = filtered.reduce((sum, wd) => sum + wd.totalRevenue, 0);
    const totalFreight = filtered.reduce(
      (sum, wd) => sum + wd.totalFreightRevenue,
      0,
    );
    const totalProfit = filtered.reduce((sum, wd) => sum + wd.totalProfit, 0);
    const totalInterest = filtered.reduce(
      (sum, wd) => sum + wd.totalInterestReceived,
      0,
    );
    // Ticket médio geral = faturamento total / pedidos totais (não é a
    // média das médias diárias, que distorceria o resultado).
    const overallAverageTicket =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return [
      {
        label: "Dias trabalhados",
        value: String(totalDays),
        icon: CalendarDays,
        color: "text-gray-700",
      },
      {
        label: "Pedidos",
        value: String(totalOrders),
        icon: Package,
        color: "text-gray-700",
      },
      {
        label: "Faturamento",
        value: formatCurrency(totalRevenue),
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        label: "Entregas",
        value: formatCurrency(totalFreight),
        icon: Bike,
        color: "text-orange-600",
      },
      {
        label: "Lucro",
        value: formatCurrency(totalProfit),
        icon: TrendingUp,
        color: totalProfit >= 0 ? "text-blue-600" : "text-red-600",
      },
      {
        label: "Juros recebidos",
        value: formatCurrency(totalInterest),
        icon: Percent,
        color: "text-purple-600",
      },
      {
        label: "Ticket médio",
        value: formatCurrency(overallAverageTicket),
        icon: Receipt,
        color: "text-gray-700",
      },
    ];
  }, [workDays, year]);

  if (!cards) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="rounded-md border border-input bg-white px-2 py-1 text-xs font-medium"
      >
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {cards.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex min-w-[140px] items-center gap-2 rounded-md border bg-white px-3 py-2"
        >
          <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
          <div className="min-w-0">
            <p className="truncate text-[10px] text-gray-500">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinanceSummaryCards;
