"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { PointsSettings, PointsTier } from "@/api/points";

interface PointsTiersPanelProps {
  tiers: PointsTier[];
  settings: PointsSettings;
  saving: boolean;
  onSave: (tiers: PointsTier[]) => void;
}

interface TierRow {
  level: string;
  name: string;
  multiplier: string;
  minActiveAffiliates: string;
}

const toRows = (tiers: PointsTier[]): TierRow[] =>
  tiers
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((tier) => ({
      level: String(tier.level),
      name: tier.name,
      multiplier: String(tier.multiplier),
      minActiveAffiliates: String(tier.minActiveAffiliates),
    }));

/**
 * A escada de tiers.
 *
 * Cada degrau é "a partir de N indicados diretos ativos, o ganho é
 * multiplicado por X". A ordem importa: o servidor recusa uma escada que
 * não sobe, porque um degrau mais alto exigindo menos gente tornaria o de
 * baixo inalcançável.
 */
const PointsTiersPanel = ({
  tiers,
  settings,
  saving,
  onSave,
}: PointsTiersPanelProps) => {
  const [rows, setRows] = useState<TierRow[]>(() => toRows(tiers));

  useEffect(() => setRows(toRows(tiers)), [tiers]);

  const update = (index: number, key: keyof TierRow, value: string) =>
    setRows((previous) =>
      previous.map((row, position) =>
        position === index ? { ...row, [key]: value } : row,
      ),
    );

  const addRow = () => {
    const nextLevel = rows.reduce(
      (highest, row) => Math.max(highest, Number(row.level) + 1),
      0,
    );
    const highestRequirement = rows.reduce(
      (highest, row) => Math.max(highest, Number(row.minActiveAffiliates)),
      0,
    );
    setRows((previous) => [
      ...previous,
      {
        level: String(nextLevel),
        name: "Novo tier",
        multiplier: "1",
        // Já nasce acima do degrau mais alto: a escada precisa subir.
        minActiveAffiliates: String(highestRequirement + 10),
      },
    ]);
  };

  const removeRow = (index: number) =>
    setRows((previous) => previous.filter((_, position) => position !== index));

  const handleSave = () => {
    const parsed = rows.map((row) => ({
      level: Number(row.level),
      name: row.name.trim(),
      multiplier: Number(row.multiplier),
      minActiveAffiliates: Number(row.minActiveAffiliates),
    }));

    const broken = parsed.find(
      (tier) =>
        !tier.name ||
        Number.isNaN(tier.level) ||
        Number.isNaN(tier.multiplier) ||
        Number.isNaN(tier.minActiveAffiliates),
    );
    if (broken) return;

    onSave(parsed);
  };

  const ordered = rows
    .slice()
    .sort((a, b) => Number(a.minActiveAffiliates) - Number(b.minActiveAffiliates));
  const climbs = ordered.every(
    (row, index) =>
      index === 0 ||
      Number(row.minActiveAffiliates) >
        Number(ordered[index - 1].minActiveAffiliates),
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-white p-5">
        <h3 className="font-semibold text-gray-900">Escada de tiers</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          O tier vem da quantidade de <strong>indicados diretos ativos</strong>{" "}
          — quem comprou nos últimos {settings.activeAffiliateWindowDays} dias.
          Rede indireta não conta. Perder um afiliado ativo rebaixa o tier,
          mas nunca tira os pontos já ganhos com ele.
        </p>

        {!settings.tiersEnabled && (
          <p className="mt-3 rounded-md bg-yellow-100 p-2 text-xs text-yellow-800">
            O multiplicador de tier está <strong>desligado</strong> nas
            regras. A escada abaixo fica guardada, mas todo mundo pontua
            como 1x.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Nível</th>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Multiplicador</th>
              <th className="px-3 py-2 font-medium">Afiliados ativos (mín.)</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={row.level}
                    onChange={(event) =>
                      update(index, "level", event.target.value)
                    }
                    className="w-20"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={row.name}
                    onChange={(event) =>
                      update(index, "name", event.target.value)
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.multiplier}
                    onChange={(event) =>
                      update(index, "multiplier", event.target.value)
                    }
                    className="w-28"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={row.minActiveAffiliates}
                    onChange={(event) =>
                      update(index, "minActiveAffiliates", event.target.value)
                    }
                    className="w-32"
                  />
                </td>
                <td className="px-3 py-2">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      title="Remover degrau"
                      className="text-gray-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!climbs && (
        <p className="rounded-md bg-red-50 p-3 text-xs text-red-800">
          <strong>A escada precisa subir.</strong> Um degrau com
          multiplicador maior tem que exigir mais afiliados que o anterior,
          senão o degrau de baixo nunca é alcançado por ninguém.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !climbs} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar tiers
        </Button>
        <Button
          onClick={addRow}
          disabled={saving}
          className="gap-2 bg-gray-500 hover:bg-gray-600"
        >
          <Plus className="h-4 w-4" />
          Adicionar degrau
        </Button>
      </div>
    </div>
  );
};

export default PointsTiersPanel;
