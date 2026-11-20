"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { PointsSettings, PointsTier } from "@/api/points";

interface PointsRulesPanelProps {
  settings: PointsSettings;
  tiers: PointsTier[];
  saving: boolean;
  onSave: (changes: Partial<PointsSettings>) => void;
  onReset: () => void;
}

/** Todo campo é texto enquanto está sendo digitado: number puro apaga o "0," do meio. */
type FormState = Record<keyof PointsSettings, string>;

const toForm = (settings: PointsSettings): FormState =>
  Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [key, String(value)]),
  ) as FormState;

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4 rounded-lg border bg-white p-5">
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    {children}
  </div>
);

const NumberField = ({
  id,
  label,
  hint,
  value,
  onChange,
  step = "0.01",
  min = 0,
  max,
  suffix,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  min?: number;
  max?: number;
  suffix?: string;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {suffix && (
        <span className="flex-shrink-0 text-sm text-gray-500">{suffix}</span>
      )}
    </div>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const Toggle = ({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) => (
  <label className="flex items-center gap-2 text-sm text-gray-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4"
    />
    {children}
  </label>
);

const PointsRulesPanel = ({
  settings,
  tiers,
  saving,
  onSave,
  onReset,
}: PointsRulesPanelProps) => {
  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Depois de salvar, o servidor é a verdade: recarrega o formulário com o
  // que ele realmente gravou, não com o que foi digitado.
  useEffect(() => setForm(toForm(settings)), [settings]);

  const set = (key: keyof PointsSettings) => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const setBool = (key: keyof PointsSettings) => (value: boolean) =>
    setForm((previous) => ({ ...previous, [key]: String(value) }));

  const num = (key: keyof PointsSettings) => Number(form[key]);
  const bool = (key: keyof PointsSettings) => form[key] === "true";

  /**
   * Prévia do custo enquanto o Admin digita.
   *
   * Repete a conta do servidor de propósito: a barreira real é lá, mas
   * esperar o erro de salvamento pra descobrir que um multiplicador
   * estourou o teto seria trabalhar às cegas.
   */
  const preview = useMemo(() => {
    // Lê direto de `form` em vez de usar os atalhos `num`/`bool`: eles são
    // recriados a cada render e entrariam nas dependências sem acrescentar
    // nada — o que muda o resultado é o formulário e a escada.
    const value = (key: keyof PointsSettings) => Number(form[key]);
    const flag = (key: keyof PointsSettings) => form[key] === "true";

    const bestRate = Math.max(
      value("moneyRate"),
      value("pixRate"),
      value("creditRate"),
      value("debitRate"),
    );
    const bestTier = flag("tiersEnabled")
      ? Math.max(...tiers.map((tier) => tier.multiplier), 1)
      : 1;
    const network = flag("mlmEnabled")
      ? value("level2Multiplier") +
        value("level3Multiplier") +
        value("level4Multiplier")
      : 0;
    const chain = value("selfMultiplier") + network;
    const perReal = value("pointsPerReal");
    if (!perReal || Number.isNaN(bestRate)) return null;

    const worst = ((bestRate * bestTier * chain) / perReal) * 100;
    const limit = value("maxCashbackPercent");
    return { worst, limit, over: worst > limit };
  }, [form, tiers]);

  const handleSave = () => {
    const changes: Partial<PointsSettings> = {
      enabled: bool("enabled"),
      moneyRate: num("moneyRate"),
      pixRate: num("pixRate"),
      creditRate: num("creditRate"),
      debitRate: num("debitRate"),
      onTheBillGraceDays: num("onTheBillGraceDays"),
      mlmEnabled: bool("mlmEnabled"),
      selfMultiplier: num("selfMultiplier"),
      level2Multiplier: num("level2Multiplier"),
      level3Multiplier: num("level3Multiplier"),
      level4Multiplier: num("level4Multiplier"),
      tiersEnabled: bool("tiersEnabled"),
      activeAffiliateWindowDays: num("activeAffiliateWindowDays"),
      pointsPerReal: num("pointsPerReal"),
      minRedeemPoints: num("minRedeemPoints"),
      maxRedeemPercent: num("maxRedeemPercent"),
      expirationDays: num("expirationDays"),
      inactivityDays: num("inactivityDays"),
      maxCashbackPercent: num("maxCashbackPercent"),
    };

    const invalid = Object.entries(changes).find(
      ([, value]) => typeof value === "number" && Number.isNaN(value),
    );
    if (invalid) return;

    onSave(changes);
  };

  const discountPerHundred = num("pointsPerReal")
    ? (100 / num("pointsPerReal")).toFixed(2)
    : "—";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-white p-5">
        <Toggle checked={bool("enabled")} onChange={setBool("enabled")}>
          <span className="font-semibold text-gray-900">
            Programa de pontos ativo
          </span>
        </Toggle>
        <p className="ml-6 mt-1 text-xs text-gray-500">
          Desligado, ninguém ganha nem resgata pontos. Os saldos já
          existentes ficam guardados — nada é apagado.
        </p>
      </div>

      <Section
        title="Quanto cada real vale"
        description="Pontos por R$ 1,00 de PRODUTO efetivamente pago. Frete e juros nunca pontuam."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            id="moneyRate"
            label="Dinheiro"
            value={form.moneyRate}
            onChange={set("moneyRate")}
            step="0.01"
            suffix="pt/R$"
          />
          <NumberField
            id="pixRate"
            label="Pix"
            value={form.pixRate}
            onChange={set("pixRate")}
            step="0.01"
            suffix="pt/R$"
          />
          <NumberField
            id="debitRate"
            label="Débito"
            value={form.debitRate}
            onChange={set("debitRate")}
            step="0.01"
            suffix="pt/R$"
          />
          <NumberField
            id="creditRate"
            label="Crédito"
            value={form.creditRate}
            onChange={set("creditRate")}
            step="0.01"
            suffix="pt/R$"
          />
        </div>

        <NumberField
          id="onTheBillGraceDays"
          label="Prazo da notinha para pontuar"
          hint="A notinha só pontua quando é quitada, e só dentro desse prazo. Pago depois disso, o cliente não ganha pontos."
          value={form.onTheBillGraceDays}
          onChange={set("onTheBillGraceDays")}
          step="1"
          suffix="dias"
        />
      </Section>

      <Section
        title="Rede de indicações"
        description="Quanto cada nível acima do comprador recebe sobre a MESMA compra. O nível 1 é o próprio comprador."
      >
        <Toggle checked={bool("mlmEnabled")} onChange={setBool("mlmEnabled")}>
          Distribuir pontos para a rede de indicações
        </Toggle>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            id="selfMultiplier"
            label="Nível 1 — o comprador"
            value={form.selfMultiplier}
            onChange={set("selfMultiplier")}
            suffix="x"
          />
          <NumberField
            id="level2Multiplier"
            label="Nível 2 — quem indicou"
            value={form.level2Multiplier}
            onChange={set("level2Multiplier")}
            suffix="x"
          />
          <NumberField
            id="level3Multiplier"
            label="Nível 3"
            value={form.level3Multiplier}
            onChange={set("level3Multiplier")}
            suffix="x"
          />
          <NumberField
            id="level4Multiplier"
            label="Nível 4"
            value={form.level4Multiplier}
            onChange={set("level4Multiplier")}
            suffix="x"
          />
        </div>

        <p className="rounded-md bg-gray-100 p-2 text-xs text-gray-600">
          A árvore para no nível 4. Quem está mais fundo que isso não recebe
          nada — é esse corte que segura o custo do programa, porque cada
          nível a mais multiplica a distribuição sobre a mesma venda.
        </p>
      </Section>

      <Section
        title="Aceleração por tier"
        description="O tier de QUEM RECEBE multiplica o ganho dele, inclusive sobre o consumo da rede abaixo."
      >
        <Toggle checked={bool("tiersEnabled")} onChange={setBool("tiersEnabled")}>
          Aplicar multiplicador de tier
        </Toggle>

        <NumberField
          id="activeAffiliateWindowDays"
          label="Janela de afiliado ativo"
          hint="Indicado direto que comprou dentro desse prazo conta para o tier. Quem sai da janela derruba o tier do padrinho, mas nunca os pontos já ganhos com ele."
          value={form.activeAffiliateWindowDays}
          onChange={set("activeAffiliateWindowDays")}
          step="1"
          suffix="dias"
        />
      </Section>

      <Section
        title="Uso dos pontos no checkout"
        description="Como o saldo vira desconto. Pontos nunca abatem frete — só o valor dos produtos."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            id="pointsPerReal"
            label="Pontos por R$ 1,00 de desconto"
            hint={`Hoje: 100 pontos = R$ ${discountPerHundred}`}
            value={form.pointsPerReal}
            onChange={set("pointsPerReal")}
            step="1"
            min={1}
          />
          <NumberField
            id="minRedeemPoints"
            label="Mínimo para usar"
            hint="Abaixo disso o cliente não consegue resgatar."
            value={form.minRedeemPoints}
            onChange={set("minRedeemPoints")}
            step="1"
            suffix="pontos"
          />
          <NumberField
            id="maxRedeemPercent"
            label="Abatimento máximo"
            hint="Teto sobre o valor dos produtos. É o que garante entrada de dinheiro novo a cada compra."
            value={form.maxRedeemPercent}
            onChange={set("maxRedeemPercent")}
            max={100}
            suffix="%"
          />
        </div>
      </Section>

      <Section
        title="Perda passiva de pontos"
        description="As duas formas de um saldo sumir sem o cliente usar. Rodam sozinhas, de madrugada."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="expirationDays"
            label="Validade de cada ponto"
            hint="Contada a partir do dia em que o ponto foi ganho."
            value={form.expirationDays}
            onChange={set("expirationDays")}
            step="1"
            suffix="dias"
          />
          <NumberField
            id="inactivityDays"
            label="Inatividade que zera o saldo"
            hint="Sem nenhuma compra nesse prazo, o cliente perde todo o saldo. Uma compra de qualquer valor reinicia a contagem."
            value={form.inactivityDays}
            onChange={set("inactivityDays")}
            step="1"
            suffix="dias"
          />
        </div>
      </Section>

      <Section
        title="Trava de segurança"
        description="Teto da distribuição de cashback, em % da receita de produtos. Deve ser o lucro líquido da empresa depois de todos os gastos."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="maxCashbackPercent"
            label="Distribuição máxima de cashback"
            value={form.maxCashbackPercent}
            onChange={set("maxCashbackPercent")}
            max={100}
            suffix="%"
          />

          {preview && (
            <div
              className={`rounded-md border p-3 text-sm ${
                preview.over
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800"
              }`}
            >
              <p className="font-semibold">
                Pior caso desta configuração: {preview.worst.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs">
                {preview.over
                  ? "Acima do teto. Salvar vai exigir confirmação — a soma dos pontos distribuídos passaria do lucro líquido e a empresa quebra no longo prazo."
                  : "Dentro do teto configurado."}
              </p>
            </div>
          )}
        </div>
      </Section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t bg-gray-50 py-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar regras
        </Button>

        {confirmingReset ? (
          <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5">
            <span className="text-xs text-yellow-900">
              Restaurar todos os campos e os tiers para o padrão de fábrica?
              Saldos e extratos não são afetados.
            </span>
            <Button
              onClick={() => {
                setConfirmingReset(false);
                onReset();
              }}
              className="h-7 bg-yellow-600 px-2 text-xs hover:bg-yellow-700"
            >
              Restaurar
            </Button>
            <Button
              onClick={() => setConfirmingReset(false)}
              className="h-7 bg-gray-400 px-2 text-xs hover:bg-gray-500"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setConfirmingReset(true)}
            disabled={saving}
            className="gap-2 bg-gray-500 hover:bg-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar padrão
          </Button>
        )}
      </div>
    </div>
  );
};

export default PointsRulesPanel;
