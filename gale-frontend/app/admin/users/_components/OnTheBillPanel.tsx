"use client";

import { useEffect, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import { getOnTheBill, updateOnTheBill, OnTheBillCredit } from "@/api/user";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

interface OnTheBillPanelProps {
  userId: string;
  userName: string;
}

/**
 * Autorização e limite de notinha de um cliente.
 *
 * O campo de limite fica vazio quando a pessoa herda o padrão da loja —
 * assim dá pra distinguir "R$ 200 porque é o padrão" de "R$ 200 porque
 * alguém decidiu R$ 200 pra ela". Limpar o campo devolve ao padrão.
 */
const OnTheBillPanel = ({ userId, userName }: OnTheBillPanelProps) => {
  const [credit, setCredit] = useState<OnTheBillCredit | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [limitDraft, setLimitDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getOnTheBill(userId)
      .then((data) => {
        setCredit(data);
        setAllowed(data.canPayOnTheBill);
        setLimitDraft(data.hasCustomLimit ? String(data.onTheBillLimit) : "");
      })
      .catch(() => toast.error("Erro ao carregar o crédito do cliente."))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    const trimmed = limitDraft.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);

    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      toast.error("Informe um limite válido ou deixe vazio para usar o padrão.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateOnTheBill(userId, {
        canPayOnTheBill: allowed,
        onTheBillLimit: parsed,
      });
      setCredit(updated);
      setLimitDraft(
        updated.hasCustomLimit ? String(updated.onTheBillLimit) : "",
      );
      toast.success(`Notinha de ${userName} atualizada.`);
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-3 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando crédito...
      </div>
    );
  }

  const usedPercent =
    credit && credit.onTheBillLimit > 0
      ? Math.min((credit.onTheBillUsed / credit.onTheBillLimit) * 100, 100)
      : 0;
  const maxedOut = credit != null && credit.onTheBillAvailable <= 0;

  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <Receipt className="h-3.5 w-3.5" />
        Notinha (fiado)
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={allowed}
          onChange={(event) => setAllowed(event.target.checked)}
          className="h-4 w-4"
        />
        Pode pegar fiado
      </label>

      <div className="space-y-1">
        <label
          htmlFor={`limit-${userId}`}
          className="block text-xs text-gray-500"
        >
          Limite deste cliente (R$)
        </label>
        <Input
          id={`limit-${userId}`}
          type="number"
          min={0}
          step="0.01"
          disabled={!allowed}
          placeholder={
            credit ? `Padrão da loja: ${credit.onTheBillLimit}` : "Padrão"
          }
          value={limitDraft}
          onChange={(event) => setLimitDraft(event.target.value)}
          className="disabled:bg-gray-100 disabled:text-gray-400"
        />
        <p className="text-[11px] text-gray-400">
          Vazio = usa o limite padrão definido em Configurações.
        </p>
      </div>

      {credit && allowed && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>
              Em aberto: {formatCurrency(credit.onTheBillUsed)} de{" "}
              {formatCurrency(credit.onTheBillLimit)}
            </span>
            <span className={maxedOut ? "font-semibold text-red-600" : ""}>
              {maxedOut
                ? "Limite atingido"
                : `Livre: ${formatCurrency(credit.onTheBillAvailable)}`}
            </span>
          </div>
          {/* Barra de uso: o Admin vê de relance se faz sentido subir o
              limite dessa pessoa. */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full ${maxedOut ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        size="sm"
        disabled={saving}
        onClick={handleSave}
        className="w-full bg-black text-white hover:bg-green-600"
      >
        {saving ? "Salvando..." : "Salvar notinha"}
      </Button>
    </div>
  );
};

export default OnTheBillPanel;
