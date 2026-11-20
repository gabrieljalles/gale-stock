"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";

interface CashbackGaugeProps {
  /** Distribuição medida ou projetada, em % da receita de produtos. */
  percent: number;
  limitPercent: number;
  title: string;
  description: string;
  /** Marca secundária na régua (ex.: o que já foi resgatado de verdade). */
  marker?: { percent: number; label: string };
}

/**
 * A régua do teto de cashback.
 *
 * Um número solto ("3,12%") não diz nada; o que decide é a distância até o
 * teto. Por isso a barra é sempre desenhada com o teto como referência
 * fixa, e não escalada pelo valor atual — senão qualquer distribuição
 * pareceria confortável.
 */
const CashbackGauge = ({
  percent,
  limitPercent,
  title,
  description,
  marker,
}: CashbackGaugeProps) => {
  const over = percent > limitPercent;
  // A régua vai até 125% do teto: sobra faixa pra enxergar o estouro sem
  // a barra encostar na borda e perder a noção de "quanto passou".
  const scale = Math.max(limitPercent * 1.25, percent * 1.05, 0.01);
  const width = Math.min((percent / scale) * 100, 100);
  const limitAt = Math.min((limitPercent / scale) * 100, 100);
  const markerAt = marker
    ? Math.min((marker.percent / scale) * 100, 100)
    : null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        over ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            {over ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            )}
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        <div className="text-right">
          <span
            className={`block text-2xl font-bold tabular-nums ${
              over ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {percent.toFixed(2)}%
          </span>
          <span className="text-[11px] text-gray-500">
            teto {limitPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="relative mt-4 h-3 w-full rounded-full bg-gray-200">
        <div
          className={`h-3 rounded-full transition-all ${
            over ? "bg-red-500" : "bg-emerald-500"
          }`}
          style={{ width: `${width}%` }}
        />

        {/* A linha do teto: é ela que dá sentido ao tamanho da barra. */}
        <div
          className="absolute -top-1 h-5 w-0.5 bg-gray-900"
          style={{ left: `${limitAt}%` }}
          title={`Teto: ${limitPercent.toFixed(2)}%`}
        />

        {markerAt !== null && marker && (
          <div
            className="absolute -top-0.5 h-4 w-0.5 bg-blue-500"
            style={{ left: `${markerAt}%` }}
            title={`${marker.label}: ${marker.percent.toFixed(2)}%`}
          />
        )}
      </div>

      {marker && (
        <p className="mt-2 text-[11px] text-gray-500">
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-blue-500 align-middle" />
          {marker.label}: <strong>{marker.percent.toFixed(2)}%</strong>
        </p>
      )}

      {over && (
        <p className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-800">
          <strong>Acima do lucro líquido.</strong> Mantido assim, o programa
          distribui mais do que a empresa ganha e quebra a operação no longo
          prazo.
        </p>
      )}
    </div>
  );
};

export default CashbackGauge;
