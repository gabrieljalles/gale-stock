"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { getWorkDays, WorkDayReport } from "@/api/workDay";

type MetricKey =
  | "totalRevenue"
  | "totalProfit"
  | "totalFreightRevenue"
  | "orderCount"
  | "averageTicket";

const METRICS: {
  key: MetricKey;
  label: string;
  color: string;
  format: (v: number) => string;
}[] = [
  {
    key: "totalRevenue",
    label: "Faturamento",
    color: "#008300",
    format: (v) => currency(v),
  },
  {
    key: "totalProfit",
    label: "Lucro",
    color: "#2a78d6",
    format: (v) => currency(v),
  },
  {
    key: "totalFreightRevenue",
    label: "Entregas",
    color: "#eb6834",
    format: (v) => currency(v),
  },
  {
    key: "orderCount",
    label: "Pedidos",
    color: "#4a3aa7",
    format: (v) => String(Math.round(v)),
  },
  {
    key: "averageTicket",
    label: "Ticket médio",
    color: "#e87ba4",
    format: (v) => currency(v),
  },
];

function currency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
    new Date(value),
  );

const WorkDayMetricsChart = () => {
  const [workDays, setWorkDays] = useState<WorkDayReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"all" | MetricKey>("all");

  useEffect(() => {
    getWorkDays()
      .then((data) => setWorkDays([...data].reverse()))
      .catch(() => toast.error("Erro ao carregar dados dos dias de trabalho."))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(
    () =>
      workDays.map((wd) => ({
        date: wd.openedAt,
        label: formatDate(wd.openedAt),
        totalRevenue: wd.totalRevenue,
        totalProfit: wd.totalProfit,
        totalFreightRevenue: wd.totalFreightRevenue,
        orderCount: wd.orderCount,
        averageTicket: wd.averageTicket,
      })),
    [workDays],
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Sem dias de trabalho registrados ainda.
      </p>
    );
  }

  const selectedMetric =
    mode === "all" ? null : METRICS.find((m) => m.key === mode)!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <BarChart3 className="h-4 w-4" />
          Métricas por dia de trabalho
        </h2>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "all" | MetricKey)}
          className="rounded-md border border-input bg-white px-2 py-1 text-xs"
        >
          <option value="all">Todos os dados</option>
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {selectedMetric ? (
        <div className="h-64 w-full rounded-md border p-2">
          <p className="mb-1 pl-1 text-xs font-medium text-gray-600">
            {selectedMetric.label}
          </p>
          <ResponsiveContainer width="100%" height="88%">
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
                width={selectedMetric.key === "orderCount" ? 28 : 56}
                tickFormatter={selectedMetric.format}
              />
              <Tooltip
                formatter={(value) => selectedMetric.format(Number(value))}
                labelFormatter={(label) => label}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric.key}
                stroke={selectedMetric.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map((metric) => (
            <div key={metric.key} className="h-44 rounded-md border p-2">
              <p className="mb-1 pl-1 text-xs font-medium text-gray-600">
                {metric.label}
              </p>
              <ResponsiveContainer width="100%" height="82%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#eeeeee" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    axisLine={{ stroke: "#e5e5e5" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                    width={metric.key === "orderCount" ? 24 : 48}
                    tickFormatter={metric.format}
                  />
                  <Tooltip
                    formatter={(value) => metric.format(Number(value))}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkDayMetricsChart;
