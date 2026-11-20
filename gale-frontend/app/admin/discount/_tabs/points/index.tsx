"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, Loader2, Lock } from "lucide-react";
import {
  getPointsConfig,
  PointsConfig,
  PointsProjection,
  PointsSettings,
  PointsTier,
  resetPointsConfig,
  updatePointsSettings,
  updatePointsTiers,
} from "@/api/points";
import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import PointsHealthPanel from "./_components/PointsHealthPanel";
import PointsRulesPanel from "./_components/PointsRulesPanel";
import PointsTiersPanel from "./_components/PointsTiersPanel";
import PointsSimulatorPanel from "./_components/PointsSimulatorPanel";

type Section = "health" | "simulator" | "rules" | "tiers";

const SECTIONS: { value: Section; label: string }[] = [
  { value: "health", label: "Saúde do programa" },
  { value: "simulator", label: "Simulador" },
  { value: "rules", label: "Regras de pontuação" },
  { value: "tiers", label: "Tiers da rede" },
];

/** Salvamento que o servidor recusou por estourar o teto, guardado pra reenviar confirmado. */
type PendingSave =
  | { kind: "settings"; changes: Partial<PointsSettings> }
  | { kind: "tiers"; tiers: PointsTier[] };

const PointsTab = () => {
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<Section>("health");

  const [pending, setPending] = useState<PendingSave | null>(null);
  const [risk, setRisk] = useState<PointsProjection | null>(null);

  useEffect(() => {
    getPointsConfig()
      .then(setConfig)
      .catch(() => toast.error("Erro ao carregar a configuração de pontos."))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Encaminha o salvamento e trata a recusa do teto.
   *
   * O servidor devolve a projeção junto com o erro, então em vez de um
   * toast genérico dá pra abrir o aviso com os números e oferecer o
   * "salvar mesmo assim" — que reenvia a MESMA alteração, agora
   * confirmada.
   */
  const submit = useCallback(
    async (save: PendingSave, acknowledge = false) => {
      setSaving(true);
      try {
        const updated =
          save.kind === "settings"
            ? await updatePointsSettings({
                ...save.changes,
                acknowledgeCashbackRisk: acknowledge,
              })
            : await updatePointsTiers(save.tiers, acknowledge);

        setConfig(updated);
        setPending(null);
        setRisk(null);
        toast.success("Configuração de pontos salva.");
      } catch (error) {
        const data = isAxiosError(error) ? error.response?.data : null;

        if (data?.code === "POINTS_CASHBACK_LIMIT") {
          setPending(save);
          setRisk(data.projection as PointsProjection);
          return;
        }

        toast.error(
          typeof data?.message === "string"
            ? data.message
            : "Erro ao salvar a configuração de pontos.",
        );
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleReset = async () => {
    setSaving(true);
    try {
      setConfig(await resetPointsConfig());
      toast.success("Configuração restaurada para o padrão.");
    } catch {
      toast.error("Erro ao restaurar a configuração.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg border bg-white p-1">
          {SECTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSection(item.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                section === item.value
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <a
          href="/pontos"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary hover:text-white"
        >
          Ver a página que o cliente lê
          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>

      {/* Um lembrete que evita a pergunta "como eu dou pontos pra esse
          cliente?": não dá, e é de propósito. */}
      <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          Crédito e débito de pontos são <strong>automáticos</strong>. Não
          existe forma de dar, tirar ou ajustar o saldo de um cliente — nem
          para o Admin. O que se controla aqui são as regras; o resto é
          consequência de compra, resgate, validade e inatividade.
        </span>
      </p>

      {section === "health" && <PointsHealthPanel />}

      {section === "simulator" && (
        <PointsSimulatorPanel settings={config.settings} tiers={config.tiers} />
      )}

      {section === "rules" && (
        <PointsRulesPanel
          settings={config.settings}
          tiers={config.tiers}
          saving={saving}
          onSave={(changes) => submit({ kind: "settings", changes })}
          onReset={handleReset}
        />
      )}

      {section === "tiers" && (
        <PointsTiersPanel
          tiers={config.tiers}
          settings={config.settings}
          saving={saving}
          onSave={(tiers) => submit({ kind: "tiers", tiers })}
        />
      )}

      <Dialog
        open={Boolean(risk)}
        onOpenChange={(open) => {
          if (!open) {
            setRisk(null);
            setPending(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Risco de prejuízo no longo prazo
            </DialogTitle>
          </DialogHeader>

          {risk && (
            <div className="space-y-4 text-sm text-gray-700">
              <p>
                Essa configuração pode distribuir até{" "}
                <strong className="text-red-700">
                  {risk.worstCasePercent.toFixed(2)}%
                </strong>{" "}
                da receita de produtos, acima do teto de{" "}
                <strong>{risk.limitPercent.toFixed(2)}%</strong>.
              </p>

              <div className="space-y-1 rounded-md bg-gray-100 p-3 text-xs">
                <div className="flex justify-between">
                  <span>Pior caso (rede cheia, tier máximo)</span>
                  <strong className="tabular-nums text-red-700">
                    {risk.worstCasePercent.toFixed(2)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Rede cheia, todos no tier de entrada</span>
                  <strong className="tabular-nums">
                    {risk.baseCasePercent.toFixed(2)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Compra avulsa, sem rede</span>
                  <strong className="tabular-nums">
                    {risk.soloPercent.toFixed(2)}%
                  </strong>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>Teto configurado (lucro líquido)</span>
                  <strong className="tabular-nums">
                    {risk.limitPercent.toFixed(2)}%
                  </strong>
                </div>
              </div>

              <p className="rounded-md bg-red-50 p-3 text-xs text-red-800">
                O teto representa o lucro líquido da empresa depois de todos
                os gastos. Distribuir acima dele significa pagar cashback com
                dinheiro que não existe: no longo prazo, quebra a operação.
              </p>

              <p className="text-xs text-gray-500">
                Pontos já concedidos nunca são removidos por uma mudança de
                configuração — só pelas regras de validade, inatividade e
                estorno.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setRisk(null);
                setPending(null);
              }}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Revisar
            </Button>
            <Button
              onClick={() => pending && submit(pending, true)}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointsTab;
