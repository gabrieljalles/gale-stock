"use client";

import { Loader2, Sparkles, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { formatPoints, PointsQuote } from "@/api/points";
import { formatCurrency } from "@/_utils/formatCurrency";

interface PointsCheckoutSectionProps {
  quote: PointsQuote | null;
  loading: boolean;
  /** Texto cru do campo: number puro atrapalha apagar e redigitar. */
  redeemInput: string;
  onChangeRedeem: (value: string) => void;
  /** Notinha não pontua na hora — os pontos só entram quando a conta é quitada. */
  isOnTheBill: boolean;
  onTheBillGraceHint?: number;
}

/**
 * O bloco de pontos do checkout.
 *
 * Duas mensagens que competem por atenção, então elas ficam separadas: em
 * cima, chamativo, quanto a pessoa VAI GANHAR fechando a compra; embaixo,
 * discreto, quanto ela pode GASTAR agora. Misturar os dois fazia o número
 * do ganho — que é o que traz a pessoa de volta — desaparecer.
 */
const PointsCheckoutSection = ({
  quote,
  loading,
  redeemInput,
  onChangeRedeem,
  isOnTheBill,
}: PointsCheckoutSectionProps) => {
  if (!quote?.enabled) return null;

  const requested = Number(redeemInput) || 0;
  const belowMinimum = requested > 0 && requested < quote.minRedeemPoints;
  const aboveCeiling = requested > quote.maxRedeemablePoints;
  const canRedeem = quote.maxRedeemablePoints >= quote.minRedeemPoints;

  return (
    <div className="mb-4 space-y-3">
      {/* ---------- O ganho ---------- */}
      <section className="overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-400 to-amber-500 p-5 text-white shadow-md">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-50">
          <Sparkles className="h-3.5 w-3.5" />
          {isOnTheBill ? "Ao quitar esta conta você ganha" : "Fechando agora você ganha"}
        </p>

        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tabular-nums">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              formatPoints(quote.pointsToEarn)
            )}
          </span>
          <span className="text-lg font-semibold text-amber-50">pontos</span>
        </p>

        {isOnTheBill ? (
          <p className="mt-1 text-sm text-amber-50">
            A notinha só pontua quando você acerta a conta — e dentro do prazo.
            O valor acima é uma estimativa com base na forma de pagamento do
            acerto.
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-50">
            Equivalem a{" "}
            <strong>
              {formatCurrency(quote.pointsToEarn / quote.pointsPerReal)}
            </strong>{" "}
            de desconto nas próximas compras.
          </p>
        )}

        {quote.tier && quote.tier.multiplier !== 1 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
            {quote.tier.name} · multiplicador{" "}
            {quote.tier.multiplier.toLocaleString("pt-BR")}x aplicado
          </p>
        )}

        <p className="mt-3 border-t border-white/25 pt-2 text-[11px] text-amber-50">
          Calculado só sobre o valor dos produtos —{" "}
          <strong>o frete não gera pontos</strong>.{" "}
          <Link href="/pontos" target="_blank" className="underline">
            Ver as regras
          </Link>
        </p>
      </section>

      {/* ---------- O resgate ---------- */}
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Ticket className="h-4 w-4" />
            Usar meus pontos
          </h2>
          <span className="text-sm text-gray-600">
            Saldo:{" "}
            <strong className="text-gray-900">
              {formatPoints(quote.balance)}
            </strong>
          </span>
        </div>

        {!canRedeem ? (
          <p className="mt-2 rounded-md bg-gray-100 p-2 text-xs text-gray-600">
            {quote.balance < quote.minRedeemPoints ? (
              <>
                Você precisa de pelo menos{" "}
                <strong>{quote.minRedeemPoints} pontos</strong> para resgatar.
                Faltam{" "}
                <strong>
                  {formatPoints(quote.minRedeemPoints - quote.balance)}
                </strong>
                .
              </>
            ) : (
              <>
                Esta compra é pequena demais para o resgate: os pontos abatem
                no máximo {quote.maxRedeemPercent}% do valor dos produtos.
              </>
            )}
          </p>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={redeemInput}
                onChange={(event) => onChangeRedeem(event.target.value)}
                className="max-w-[160px]"
              />
              <span className="text-sm text-gray-500">pontos</span>
              <Button
                type="button"
                onClick={() => onChangeRedeem(String(quote.maxRedeemablePoints))}
                className="ml-auto h-9 bg-gray-500 px-3 text-xs hover:bg-gray-600"
              >
                Usar o máximo
              </Button>
            </div>

            {belowMinimum && (
              <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                A quantidade mínima permitida é{" "}
                <strong>{quote.minRedeemPoints} pontos</strong>.
              </p>
            )}

            {aboveCeiling && !belowMinimum && (
              <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                Nesta compra você pode usar no máximo{" "}
                <strong>{formatPoints(quote.maxRedeemablePoints)} pontos</strong>{" "}
                — os pontos abatem só até {quote.maxRedeemPercent}% do valor
                dos produtos, e nunca o frete.
              </p>
            )}

            {quote.redeemDiscount > 0 && (
              <p className="mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
                <strong>{formatPoints(quote.redeemPoints)} pontos</strong> viram{" "}
                <strong>{formatCurrency(quote.redeemDiscount)}</strong> de
                desconto neste pedido.
              </p>
            )}

            <p className="mt-2 text-[11px] text-gray-400">
              {quote.pointsPerReal} pontos = {formatCurrency(1)}. O que você
              paga com pontos não gera pontos de novo.
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default PointsCheckoutSection;
