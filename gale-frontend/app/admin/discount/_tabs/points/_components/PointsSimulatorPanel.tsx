"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calculator, Sparkles, TrendingUp, Users } from "lucide-react";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { getPointsSummary, PointsSettings, PointsTier } from "@/api/points";
import { formatCurrency } from "@/_utils/formatCurrency";
import CashbackGauge from "./CashbackGauge";

interface PointsSimulatorPanelProps {
  settings: PointsSettings;
  tiers: PointsTier[];
}

type PaymentMethod = "Money" | "Pix" | "DebitCard" | "CreditCard";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  Money: "Dinheiro",
  Pix: "Pix",
  DebitCard: "Débito",
  CreditCard: "Crédito",
};

type Scenario = "solo" | "chain";

/** Rótulo de cada posição da corrente, do jeito que o Admin reconhece na tela pública. */
const LEVEL_LABELS = [
  "Nível 1 — quem comprou",
  "Nível 2 — quem indicou",
  "Nível 3 — indicado do indicado",
  "Nível 4 — mais um acima",
];

const rateOf = (settings: PointsSettings, method: PaymentMethod): number => {
  switch (method) {
    case "Money":
      return settings.moneyRate;
    case "Pix":
      return settings.pixRate;
    case "DebitCard":
      return settings.debitRate;
    case "CreditCard":
      return settings.creditRate;
  }
};

/** Nível 2, 3 e 4 zeram junto se a rede estiver desligada; o nível 1 nunca. */
const levelMultiplierOf = (
  settings: PointsSettings,
  distance: number,
): number => {
  if (distance > 0 && !settings.mlmEnabled) return 0;
  switch (distance) {
    case 0:
      return settings.selfMultiplier;
    case 1:
      return settings.level2Multiplier;
    case 2:
      return settings.level3Multiplier;
    case 3:
      return settings.level4Multiplier;
    default:
      return 0;
  }
};

/**
 * Simulador de pontuação.
 *
 * Não é um relatório do que já aconteceu (isso é a aba "Saúde") — é uma
 * calculadora de "e se": escolhe um valor de compra, uma forma de
 * pagamento e o tier de cada pessoa da corrente, e mostra exatamente
 * quanto cada uma ganharia. A conta é a MESMA do motor real
 * (points.service.ts: base × taxa × multiplicador de nível × tier de
 * quem recebe), refeita aqui porque é só aritmética sobre a configuração
 * já carregada — nenhuma compra de verdade é criada.
 */
const PointsSimulatorPanel = ({ settings, tiers }: PointsSimulatorPanelProps) => {
  const [amountInput, setAmountInput] = useState("100");
  const [method, setMethod] = useState<PaymentMethod>("Pix");
  const [scenario, setScenario] = useState<Scenario>("chain");

  const orderedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.multiplier - b.multiplier),
    [tiers],
  );
  const highestTierLevel = orderedTiers[orderedTiers.length - 1]?.level ?? 0;
  const lowestTierLevel = orderedTiers[0]?.level ?? 0;

  // O tier de cada posição da corrente é independente — é literalmente a
  // regra ("o tier de quem RECEBE multiplica o próprio ganho"). Por
  // padrão todo mundo entra no tier mais alto: é o cenário que mais
  // preocupa, e é o que a pergunta original pedia ("maior tier possível").
  const [levelTiers, setLevelTiers] = useState<number[]>(() => [
    highestTierLevel,
    highestTierLevel,
    highestTierLevel,
    highestTierLevel,
  ]);

  // Se o Admin trocar a escada de tiers (outra aba) enquanto esta está
  // aberta, os seletores não podem continuar apontando pra um nível que
  // não existe mais.
  useEffect(() => {
    setLevelTiers((current) =>
      current.map((level) =>
        tiers.some((tier) => tier.level === level) ? level : highestTierLevel,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers]);

  const setLevelTier = (index: number, level: number) =>
    setLevelTiers((current) =>
      current.map((value, position) => (position === index ? level : value)),
    );

  const applyPreset = (level: number) =>
    setLevelTiers([level, level, level, level]);

  // ---------- Faturamento real, pra dar escala ao número simulado ----------
  const [realRevenue, setRealRevenue] = useState<number | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  useEffect(() => {
    getPointsSummary(30)
      .then((summary) => setRealRevenue(summary.productRevenue))
      .catch(() => {
        // Sem o resumo, o simulador ainda funciona — só fica sem a
        // comparação com o faturamento real.
        toast.error("Não foi possível carregar o faturamento real para comparação.");
      })
      .finally(() => setLoadingRevenue(false));
  }, []);

  // ---------- O cálculo ----------
  const amount = Number(amountInput.replace(",", "."));
  const validAmount = Number.isFinite(amount) && amount > 0;
  const rate = rateOf(settings, method);
  const activeLevels = scenario === "solo" ? 1 : 4;

  const rows = useMemo(() => {
    if (!validAmount) return [];
    const basePoints = amount * rate;

    return Array.from({ length: activeLevels }, (_, distance) => {
      const levelMultiplier = levelMultiplierOf(settings, distance);
      const tierLevel = levelTiers[distance];
      const tier = tiers.find((t) => t.level === tierLevel);
      const tierMultiplier = settings.tiersEnabled ? (tier?.multiplier ?? 1) : 1;

      const points = basePoints * levelMultiplier * tierMultiplier;
      const value = points / settings.pointsPerReal;

      return {
        distance,
        label: LEVEL_LABELS[distance],
        levelMultiplier,
        tier,
        tierMultiplier,
        points,
        value,
        earns: levelMultiplier > 0,
      };
    });
  }, [validAmount, amount, rate, activeLevels, settings, tiers, levelTiers]);

  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);
  const totalValue = totalPoints / settings.pointsPerReal;
  const costPercentOfSale = validAmount ? (totalValue / amount) * 100 : 0;

  // Extrapolação: se TODO o faturamento real dos últimos 30 dias tivesse
  // esse mesmo padrão de compra (mesma forma de pagamento, mesma corrente,
  // mesmos tiers), é isso que o programa custaria de verdade. É a resposta
  // direta pra "quanto eu realmente estou dando de cashback, baseado no
  // faturamento da empresa".
  const extrapolatedCost =
    realRevenue !== null ? realRevenue * (costPercentOfSale / 100) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-white p-5">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <Calculator className="h-4 w-4" />
          Simulador de pontuação
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Monte um cenário de compra e veja, número por número, quanto cada
          pessoa da corrente ganharia — e quanto isso pesaria se fosse o
          padrão de todo o seu faturamento.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sim-amount">Valor da compra (produtos)</Label>
            <Input
              id="sim-amount"
              type="number"
              min={0}
              step="0.01"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    method === option
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {PAYMENT_LABELS[option]}{" "}
                  <span className="opacity-70">
                    ({rateOf(settings, option).toLocaleString("pt-BR")}pt/R$)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label>Quem está comprando</Label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setScenario("solo")}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                scenario === "solo"
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Ele mesmo, sem rede (compra avulsa)
            </button>
            <button
              type="button"
              onClick={() => setScenario("chain")}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                scenario === "chain"
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Uma pessoa de nível 4 (corrente completa)
            </button>
          </div>
          {!settings.mlmEnabled && scenario === "chain" && (
            <p className="text-xs text-amber-700">
              A distribuição pra rede está desligada nas regras — só o
              nível 1 vai pontuar, mesmo simulando a corrente inteira.
            </p>
          )}
        </div>

        {settings.tiersEnabled && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tier de cada pessoa</Label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(highestTierLevel)}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Todos no tier máximo
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(lowestTierLevel)}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Todos no tier base
                </button>
              </div>
            </div>

            {/* O tier é de QUEM RECEBE, não de quem comprou — por isso
                cada posição da corrente tem o próprio seletor. */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: activeLevels }, (_, distance) => (
                <div key={distance} className="space-y-1">
                  <span className="text-xs text-gray-500">
                    {LEVEL_LABELS[distance]}
                  </span>
                  <select
                    value={levelTiers[distance]}
                    onChange={(event) =>
                      setLevelTier(distance, Number(event.target.value))
                    }
                    className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
                  >
                    {orderedTiers.map((tier) => (
                      <option key={tier.level} value={tier.level}>
                        {tier.name} ({tier.multiplier.toLocaleString("pt-BR")}x)
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Resultado ---------- */}
      {!validAmount ? (
        <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-500">
          Informe um valor de compra maior que zero.
        </p>
      ) : (
        <>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Users className="h-4 w-4" />
              Quem ganha o quê nesta única venda
            </h3>

            <ul className="mt-3 divide-y rounded-lg border">
              {rows.map((row) => (
                <li
                  key={row.distance}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm"
                >
                  <span className="w-full flex-shrink-0 text-gray-800 sm:w-56">
                    {row.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(rate).toLocaleString("pt-BR")}pt/R$ × {row.levelMultiplier.toLocaleString("pt-BR")}x
                    {settings.tiersEnabled && row.tier && (
                      <> × {row.tierMultiplier.toLocaleString("pt-BR")}x ({row.tier.name})</>
                    )}
                  </span>
                  <span className="ml-auto flex-shrink-0 text-right">
                    <span
                      className={`block text-sm font-bold tabular-nums ${
                        row.earns ? "text-amber-600" : "text-red-500"
                      }`}
                    >
                      {row.earns
                        ? `${row.points.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} pts`
                        : "0 ponto"}
                    </span>
                    {row.earns && (
                      <span className="text-xs text-gray-500">
                        {formatCurrency(row.value)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                <Sparkles className="h-4 w-4" />
                Total gerado por esta venda de {formatCurrency(amount)}
              </span>
              <span className="text-right">
                <span className="block text-lg font-bold tabular-nums text-amber-700">
                  {totalPoints.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} pts
                </span>
                <span className="text-xs text-amber-800">
                  {formatCurrency(totalValue)} · {costPercentOfSale.toFixed(2)}% do valor da venda
                </span>
              </span>
            </div>
          </div>

          {/* ---------- Escala: contra o faturamento real ---------- */}
          <div className="space-y-3">
            <CashbackGauge
              title="Se esse padrão de venda fosse a regra"
              description={
                loadingRevenue
                  ? "Carregando o faturamento real dos últimos 30 dias..."
                  : realRevenue !== null
                    ? `Extrapolando ${costPercentOfSale.toFixed(2)}% sobre seu faturamento real de produtos dos últimos 30 dias (${formatCurrency(realRevenue)}).`
                    : "Faturamento real indisponível no momento."
              }
              percent={costPercentOfSale}
              limitPercent={settings.maxCashbackPercent}
            />

            {realRevenue !== null && extrapolatedCost !== null && (
              <p className="flex items-start gap-2 rounded-md bg-gray-100 p-3 text-sm text-gray-700">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                <span>
                  Se <strong>toda</strong> a receita de produtos dos últimos
                  30 dias tivesse acontecido nesse padrão, o cashback
                  distribuído seria de{" "}
                  <strong
                    className={
                      costPercentOfSale > settings.maxCashbackPercent
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  >
                    {formatCurrency(extrapolatedCost)}
                  </strong>{" "}
                  — {costPercentOfSale > settings.maxCashbackPercent ? (
                    <>acima do teto de {settings.maxCashbackPercent}% do lucro líquido.</>
                  ) : (
                    <>dentro do teto de {settings.maxCashbackPercent}% do lucro líquido.</>
                  )}
                </span>
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Isto é uma simulação: nenhuma compra é criada e nenhum ponto é
            concedido. Os números usam a mesma fórmula do motor real, sobre a
            configuração salva atualmente — mudar as regras nas outras
            abas muda também o que este simulador mostra.
          </p>
        </>
      )}
    </div>
  );
};

export default PointsSimulatorPanel;
