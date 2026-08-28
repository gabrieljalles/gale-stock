"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";
import { useWorkDay } from "@/_store/workDay/WorkDayContext";

// Mesma altura da caixa de "Produtos vencidos", pra ficarem alinhadas.
const CONTAINER_HEIGHT = 208;
const CHART_PADDING = 16; // p-2 (topo + baixo)
const AXIS_HEIGHT = 20; // altura fixa reservada pro eixo numérico
const VISIBLE_BARS = 5;
const BAR_HEIGHT = Math.floor(
  (CONTAINER_HEIGHT - CHART_PADDING - AXIS_HEIGHT) / VISIBLE_BARS,
);

const TopProductsChart = () => {
  const { topProducts: products, loading } = useWorkDay();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (products.length === 0) return null;

  const chartHeight =
    Math.max(products.length, VISIBLE_BARS) * BAR_HEIGHT + AXIS_HEIGHT;

  return (
    <div className="min-w-0 flex-1">
      <div
        className="overflow-y-auto rounded-md border p-2"
        style={{ height: CONTAINER_HEIGHT }}
      >
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={products}
              layout="vertical"
              margin={{ top: 0, bottom: 0, left: 8, right: 16 }}
            >
              <CartesianGrid stroke="#eeeeee" horizontal={false} />
              <XAxis
                type="number"
                height={AXIS_HEIGHT}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={{ stroke: "#e5e5e5" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="productName"
                width={110}
                tick={{ fontSize: 11, fill: "#3f3f46" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value} un.`, "Vendidos"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="quantity" fill="#eda100" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TopProductsChart;
