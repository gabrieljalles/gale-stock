"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingDown, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import {
  formatPoints,
  getPointsSummary,
  PointsSummary,
} from "@/api/points";
import { formatCurrency } from "@/_utils/formatCurrency";
import CashbackGauge from "./CashbackGauge";

const PERIODS = [
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "1 ano", value: 365 },
];

const Metric = ({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad";
}) => (
  <div className="rounded-lg border bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p
      className={`mt-1 text-xl font-bold tabular-nums ${
        tone === "good"
          ? "text-emerald-600"
          : tone === "bad"
            ? "text-red-600"
            : "text-gray-900"
      }`}
    >
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

/**
 * "Estou quebrando no longo prazo?" respondido com números.
 *
 * A leitura é em duas camadas: o que a regra PODE custar (projeção) e o
 * que ela está custando de fato (distribuição medida). Só a segunda diz se
 * o programa está saudável hoje; só a primeira avisa antes de estragar.
 */
const PointsHealthPanel = () => {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPointsSummary(days)
      .then(setSummary)
      .catch(() => toast.error("Erro ao carregar o resumo de pontos."))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading && !summary) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando resumo...
      </div>
    );
  }

  if (!summary) return null;

  const noRevenue = summary.productRevenue <= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Período:</span>
        {PERIODS.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => setDays(period.value)}
            className={`rounded-md border px-3 py-1 text-sm transition-colors ${
              days === period.value
                ? "border-primary bg-primary text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {period.label}
          </button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CashbackGauge
          title="Distribuição real do período"
          description={
            noRevenue
              ? "Ainda não houve receita de produtos paga nesse período."
              : "Pontos emitidos, em % da receita de produtos efetivamente recebida."
          }
          percent={summary.distributionPercent}
          limitPercent={summary.limitPercent}
          marker={{
            percent: summary.redeemedPercent,
            label: "Já resgatado (custo que saiu do caixa)",
          }}
        />

        <CashbackGauge
          title="Pior caso da configuração"
          description="Rede cheia nos 4 níveis, todo mundo no tier mais alto, na forma de pagamento que mais pontua."
          percent={summary.projection.worstCasePercent}
          limitPercent={summary.projection.limitPercent}
          marker={{
            percent: summary.projection.soloPercent,
            label: "Compra avulsa, sem rede",
          }}
        />
      </div>

      {/* Passivo é o número que ninguém olha e que dói depois: ponto
          emitido é dívida com o cliente até vencer ou ser usado. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Receita de produtos"
          value={formatCurrency(summary.productRevenue)}
          hint={`Bruto ${formatCurrency(summary.grossProductRevenue)} menos os descontos em pontos`}
        />
        <Metric
          label="Pontos emitidos"
          value={formatPoints(summary.pointsIssued)}
          hint={`Equivalem a ${formatCurrency(summary.pointsIssuedValue)}`}
          tone={summary.overLimit ? "bad" : "neutral"}
        />
        <Metric
          label="Pontos resgatados"
          value={formatPoints(summary.pointsRedeemed)}
          hint={`${formatCurrency(summary.pointsRedeemedValue)} de desconto dado`}
        />
        <Metric
          label="Passivo em circulação"
          value={formatCurrency(summary.outstandingValue)}
          hint={`${formatPoints(summary.outstandingPoints)} pontos podem virar desconto`}
          tone="bad"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Vencem em 30 dias"
          value={formatPoints(summary.expiringIn30DaysPoints)}
          hint="Passivo que se resolve sozinho"
          tone="good"
        />
        <Metric
          label="Vencidos no período"
          value={formatPoints(summary.pointsExpired)}
          hint="Saíram do passivo sem custo"
          tone="good"
        />
        <Metric
          label="Perdidos por inatividade"
          value={formatPoints(summary.pointsLostToInactivity)}
          hint="Clientes que pararam de comprar"
          tone="good"
        />
        <Metric
          label="Estornados"
          value={formatPoints(summary.pointsReversed)}
          hint="Pedidos cancelados ou revertidos"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* De onde vem o custo: se o nível 1 domina, o programa é cashback
            simples; se os níveis 2-4 crescem, a rede é que está pesando. */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <TrendingUp className="h-4 w-4" />
            Pontos emitidos por nível
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Nível 1 é a própria compra. Do 2 ao 4 é o que a rede de
            indicações custa.
          </p>

          <div className="mt-4 space-y-2">
            {summary.byLevel.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhum ponto emitido no período.
              </p>
            )}
            {summary.byLevel.map((row) => {
              const share =
                summary.pointsIssued > 0
                  ? (row.points / summary.pointsIssued) * 100
                  : 0;
              return (
                <div key={row.level} className="flex items-center gap-3">
                  <span className="w-16 flex-shrink-0 text-xs text-gray-600">
                    Nível {row.level}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <span className="w-28 flex-shrink-0 text-right text-xs tabular-nums text-gray-700">
                    {formatPoints(row.points)} ({share.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Users className="h-4 w-4" />
            Padrinhos por tier
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Só conta quem tem pelo menos um indicado ativo. Tier alto
            multiplica o ganho de toda a linha abaixo.
          </p>

          <div className="mt-4 space-y-2">
            {summary.tierHistogram.map((tier) => (
              <div key={tier.level} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                  {tier.name}{" "}
                  <span className="text-gray-400">({tier.multiplier}x)</span>
                </span>
                <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-gray-900">
                  {tier.sponsors}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {summary.holders}
              </p>
              <p className="text-[11px] text-gray-500">com saldo</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {summary.referredUsers}
              </p>
              <p className="text-[11px] text-gray-500">vieram por indicação</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {summary.sponsorsWithActiveNetwork}
              </p>
              <p className="text-[11px] text-gray-500">padrinhos ativos</p>
            </div>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-md bg-gray-100 p-3 text-xs text-gray-600">
        <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          A distribuição real fica naturalmente abaixo do pior caso: nem todo
          cliente tem rede completa e boa parte dos pontos vence ou é perdida
          por inatividade antes de virar desconto. O número que representa
          dinheiro que já saiu do caixa é o de{" "}
          <strong>pontos resgatados</strong> — os demais ainda são passivo.
        </span>
      </p>
    </div>
  );
};

export default PointsHealthPanel;
