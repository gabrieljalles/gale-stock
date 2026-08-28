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
  Legend,
} from "recharts";
import { Loader2, LineChart as LineChartIcon } from "lucide-react";
import { toast } from "sonner";
import { getProductMarginTrend, ProductMarginPoint } from "@/api/reports";
import { getCatalogItems, CatalogItem } from "@/api/catalog";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
    new Date(value),
  );

const DAY_OPTIONS = [7, 30, 90];

// Estuda a margem de UM produto ao longo do tempo: preço de venda x custo
// (mesma escala, R$, um gráfico) e a margem % resultante (escala diferente,
// por isso em um segundo gráfico logo abaixo, alinhado pelos mesmos dias).
const ProductMarginChart = () => {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ProductMarginPoint[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(false);

  useEffect(() => {
    getCatalogItems()
      .then((items) => {
        setProducts(items);
        if (items.length > 0) setProductId(items[0].id);
      })
      .catch(() => toast.error("Erro ao carregar produtos."))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoadingTrend(true);
    getProductMarginTrend(productId, days)
      .then(setData)
      .catch(() => toast.error("Erro ao carregar a margem do produto."))
      .finally(() => setLoadingTrend(false));
  }, [productId, days]);

  const chartData = useMemo(
    () => data.map((d) => ({ ...d, label: formatDate(d.date) })),
    [data],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <LineChartIcon className="h-4 w-4" />
          Margem por produto
        </h2>
        <div className="flex gap-2">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={loadingProducts}
            className="rounded-md border border-input bg-white px-2 py-1 text-xs"
          >
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.product.name}
              </option>
            ))}
          </select>
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
      </div>

      {loadingProducts || loadingTrend ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-500">
          Sem vendas desse produto com custo registrado nesse período.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Venda x Custo — mesma unidade (R$), um único eixo */}
          <div className="h-56 w-full rounded-md border p-2">
            <p className="mb-1 pl-1 text-xs font-medium text-gray-600">
              Venda x Custo
            </p>
            <ResponsiveContainer width="100%" height="86%">
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
                  width={64}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  verticalAlign="top"
                  height={24}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  name="Venda"
                  type="monotone"
                  dataKey="totalPrice"
                  stroke="#008300"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Custo"
                  type="monotone"
                  dataKey="totalCost"
                  stroke="#e34948"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Margem % — escala diferente (%), por isso em gráfico à parte,
              alinhado pelos mesmos dias do gráfico acima. */}
          <div className="h-40 w-full rounded-md border p-2">
            <p className="mb-1 pl-1 text-xs font-medium text-gray-600">
              Margem (%)
            </p>
            <ResponsiveContainer width="100%" height="80%">
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
                  strokeDasharray="5 4"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMarginChart;
