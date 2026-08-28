"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getMarginTrend, MarginTrendPoint } from "@/api/reports";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
    new Date(value),
  );

const DAY_OPTIONS = [7, 30, 90];

const MarginTrendChart = () => {
  const [data, setData] = useState<MarginTrendPoint[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMarginTrend(days)
      .then(setData)
      .catch(() => toast.error("Erro ao carregar a tendência de margem."))
      .finally(() => setLoading(false));
  }, [days]);

  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <TrendingUp className="h-4 w-4" />
          Margem média da loja ao longo do tempo
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-input bg-white px-2 py-1 text-xs"
        >
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              Últimos {d} dias
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-500">
          Sem vendas com custo registrado nesse período.
        </p>
      ) : (
        <div className="h-64 w-full rounded-md border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#eeeeee" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={{ stroke: "#e5e5e5" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
              />
              <Tooltip
                formatter={(value) => `${Number(value).toFixed(1)}%`}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="marginPercent"
                stroke="#2a78d6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MarginTrendChart;
