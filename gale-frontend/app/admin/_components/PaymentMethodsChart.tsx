"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CreditCard, Loader2 } from "lucide-react";
import {
  getSalesByPaymentMethod,
  getTodaySalesByPaymentMethod,
  PaymentMethodSlice,
} from "@/api/reports";
import { transactionTypes } from "@/_constants/transaction";

// Mesma altura dos outros indicadores do Resumo, pra linha ficar alinhada.
const COMPACT_HEIGHT = 208;

const LABELS: Record<string, string> = Object.fromEntries(
  transactionTypes.map((t) => [t.value, t.label]),
);

// Nomes curtos: "Cartão de Crédito" não cabe numa legenda de 160px.
const SHORT_LABELS: Record<string, string> = {
  CreditCard: "Crédito",
  DebitCard: "Débito",
  Pix: "Pix",
  Money: "Dinheiro",
  OnTheBill: "Notinha",
  BankSlip: "Boleto",
};

// Hex direto porque recharts pinta via SVG, não por classe do Tailwind.
// Cores bem separadas entre si — a pizza precisa ser lida de relance.
const COLORS: Record<string, string> = {
  Money: "#16a34a",
  Pix: "#0d9488",
  CreditCard: "#2563eb",
  DebitCard: "#7c3aed",
  OnTheBill: "#ea580c",
  BankSlip: "#64748b",
};
const FALLBACK_COLOR = "#a1a1aa";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

interface PaymentMethodsChartProps {
  /** "all" = acumulado da loja (Dashboard); "today" = dia aberto (Resumo). */
  scope?: "all" | "today";
  /** Versão reduzida, do tamanho dos indicadores do Resumo. */
  compact?: boolean;
}

const PaymentMethodsChart = ({
  scope = "all",
  compact = false,
}: PaymentMethodsChartProps) => {
  const [slices, setSlices] = useState<PaymentMethodSlice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load =
      scope === "today" ? getTodaySalesByPaymentMethod : getSalesByPaymentMethod;

    load()
      .then(setSlices)
      .catch(() => {
        // Silencioso: sem dados o componente já se esconde sozinho.
      })
      .finally(() => setLoading(false));
  }, [scope]);

  const grossTotal = slices.reduce((sum, slice) => sum + slice.total, 0);
  const netTotal = slices.reduce((sum, slice) => sum + slice.net, 0);
  const feeTotal = grossTotal - netTotal;

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-gray-500"
        style={compact ? { height: COMPACT_HEIGHT } : undefined}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  // No Resumo o card some quando não há venda recebida — mesma regra dos
  // outros avisos, pra não deixar um buraco vazio na linha.
  if (slices.length === 0) {
    if (compact) return null;
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Vendas por forma de pagamento
        </h2>
        <p className="mt-3 rounded-md border p-6 text-center text-sm text-gray-400">
          Nenhuma venda recebida ainda.
        </p>
      </div>
    );
  }

  const tooltip = (
    <Tooltip
      contentStyle={{ fontSize: 12 }}
      formatter={(value, _name, item) => {
        // O recharts tipa o payload como genérico; aqui ele é sempre uma
        // fatia, porque é o mesmo array passado no dataKey.
        const slice = item?.payload as PaymentMethodSlice | undefined;
        const gross = Number(value);
        if (!slice) return formatCurrency(gross);

        const share = grossTotal > 0 ? (slice.total / grossTotal) * 100 : 0;
        return [
          `${formatCurrency(gross)} (${share.toFixed(1)}%) · líquido ${formatCurrency(slice.net)}`,
          LABELS[slice.transactionType] ?? slice.transactionType,
        ];
      }}
    />
  );

  const pieCells = slices.map((slice) => (
    <Cell
      key={slice.transactionType}
      fill={COLORS[slice.transactionType] ?? FALLBACK_COLOR}
    />
  ));

  if (compact) {
    return (
      <div
        className="flex w-full flex-shrink-0 flex-col rounded-md border p-3 lg:w-40"
        style={{ height: COMPACT_HEIGHT }}
      >
        {/* Orçamento de altura, dentro dos 184px úteis (208 menos o p-3):
            cabeçalho 16 + rosca 68 + rodapé 31 (duas linhas) = 115, sobrando
            69px pra legenda. A 13px por linha cabem 5 formas de pagamento
            sem scroll — e na prática só existem 4 (dinheiro, Pix, crédito e
            débito), que ocupam 52px. */}
        <div className="mb-0.5 flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold leading-[15px] text-gray-700">
          <CreditCard className="h-3 w-3" />
          Recebido hoje
        </div>

        <div className="h-[68px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="total"
                nameKey="transactionType"
                innerRadius={17}
                outerRadius={31}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {pieCells}
              </Pie>
              {tooltip}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* overflow-y-auto fica como rede de segurança: se um dia surgir
            uma forma de pagamento a mais, é melhor uma barrinha do que
            esconder uma linha de faturamento. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {slices.map((slice) => (
            <div
              key={slice.transactionType}
              className="flex items-center gap-1 text-[10px] leading-[13px]"
            >
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    COLORS[slice.transactionType] ?? FALLBACK_COLOR,
                }}
              />
              <span className="truncate text-gray-600">
                {SHORT_LABELS[slice.transactionType] ?? slice.transactionType}
              </span>
              <span className="ml-auto flex-shrink-0 font-medium text-gray-800">
                {formatCurrency(slice.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Duas linhas curtas em vez de uma frase: numa coluna de 160px a
            frase corrida quebrava sozinha e empurrava a legenda. */}
        <div className="mt-0.5 flex-shrink-0 border-t pt-0.5 text-[10px] leading-[13px] text-gray-500">
          <div className="flex items-center gap-1">
            <span>Total</span>
            <span className="ml-auto font-medium text-gray-700">
              {formatCurrency(grossTotal)}
            </span>
          </div>
          {feeTotal > 0 && (
            <div className="flex items-center gap-1">
              <span>Líquido</span>
              <span className="ml-auto font-medium text-green-600">
                {formatCurrency(netTotal)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Vendas por forma de pagamento
      </h2>
      <p className="mb-3 text-sm text-gray-500">
        Acumulado do que já foi recebido. Notinha em aberto não entra — ela só
        aparece aqui depois de fechada, na forma de pagamento escolhida.
      </p>

      <div className="flex flex-wrap items-center gap-6">
        <div className="h-56 w-56 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="total"
                nameKey="transactionType"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
              >
                {pieCells}
              </Pie>
              {tooltip}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda como tabela: a pizza mostra a proporção, os números
            mostram quanto a maquininha levou de cada forma. */}
        <div className="min-w-0 flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500">
                <th className="py-1 text-left font-medium">Forma</th>
                <th className="py-1 text-right font-medium">Vendas</th>
                <th className="py-1 text-right font-medium">Bruto</th>
                <th className="py-1 text-right font-medium">Taxa</th>
                <th className="py-1 text-right font-medium">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice) => (
                <tr key={slice.transactionType} className="border-b">
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[slice.transactionType] ?? FALLBACK_COLOR,
                        }}
                      />
                      <span className="truncate text-gray-800">
                        {LABELS[slice.transactionType] ?? slice.transactionType}
                      </span>
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-gray-600">
                    {slice.orderCount}
                  </td>
                  <td className="py-1.5 text-right text-gray-900">
                    {formatCurrency(slice.total)}
                  </td>
                  <td className="py-1.5 text-right text-gray-500">
                    {slice.fee > 0 ? `− ${formatCurrency(slice.fee)}` : "—"}
                  </td>
                  <td className="py-1.5 text-right font-medium text-green-600">
                    {formatCurrency(slice.net)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-1.5 text-gray-900">Total</td>
                <td className="py-1.5 text-right text-gray-600">
                  {slices.reduce((sum, slice) => sum + slice.orderCount, 0)}
                </td>
                <td className="py-1.5 text-right text-gray-900">
                  {formatCurrency(grossTotal)}
                </td>
                <td className="py-1.5 text-right text-gray-500">
                  {feeTotal > 0 ? `− ${formatCurrency(feeTotal)}` : "—"}
                </td>
                <td className="py-1.5 text-right text-green-600">
                  {formatCurrency(netTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsChart;
