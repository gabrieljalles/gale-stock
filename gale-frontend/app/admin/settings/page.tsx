"use client";

import { useContext, useEffect, useState } from "react";
import SideBar from "@/admin/_components/SideBar";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import {
  ExternalLink,
  Loader2,
  Settings as SettingsIcon,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/api/settings";
import { getPointsConfig } from "@/api/points";
import { isAxiosError } from "axios";
import StoreStatusToggle from "../_components/StoreStatusToggle";
import WeeklyScheduleEditor from "./_components/WeeklyScheduleEditor";

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [nightPriceEnabled, setNightPriceEnabled] = useState(true);
  const [nightPriceStartHour, setNightPriceStartHour] = useState("23");
  const [nightPriceEndHour, setNightPriceEndHour] = useState("7");
  const [nightPriceMarkupPercent, setNightPriceMarkupPercent] = useState("5");
  const [ifoodMarkupPercent, setIfoodMarkupPercent] = useState("27");
  const [freightPrice, setFreightPrice] = useState("5");
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [oneManArmyMode, setOneManArmyMode] = useState(false);
  const [city, setCity] = useState("Ituiutaba");
  const [state, setState] = useState("MG");
  const [creditCardFeePercent, setCreditCardFeePercent] = useState("0");
  const [debitCardFeePercent, setDebitCardFeePercent] = useState("0");
  const [pixFeePercent, setPixFeePercent] = useState("0");
  const [defaultOnTheBillLimit, setDefaultOnTheBillLimit] = useState("200");
  const [simplesNacionalEnabled, setSimplesNacionalEnabled] = useState(false);
  const [taxPercent, setTaxPercent] = useState("0");
  const [taxDeduction, setTaxDeduction] = useState("0");

  // Espelho só de leitura do teto de cashback. Editar continua sendo em
  // Promoções > Pontos: o número só faz sentido ao lado dos multiplicadores
  // que ele limita, e dois lugares de edição virariam duas verdades.
  const [maxCashbackPercent, setMaxCashbackPercent] = useState<number | null>(
    null,
  );

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setAutoScheduleEnabled(settings.autoScheduleEnabled);
        setNightPriceEnabled(settings.nightPriceEnabled);
        setNightPriceStartHour(String(settings.nightPriceStartHour));
        setNightPriceEndHour(String(settings.nightPriceEndHour));
        setNightPriceMarkupPercent(String(settings.nightPriceMarkupPercent));
        setIfoodMarkupPercent(String(settings.ifoodMarkupPercent));
        setFreightPrice(String(settings.freightPrice));
        setDeliveryEnabled(settings.deliveryEnabled);
        setOneManArmyMode(settings.oneManArmyMode);
        setCity(settings.city);
        setState(settings.state);
        setCreditCardFeePercent(String(settings.creditCardFeePercent));
        setDebitCardFeePercent(String(settings.debitCardFeePercent));
        setPixFeePercent(String(settings.pixFeePercent));
        setDefaultOnTheBillLimit(String(settings.defaultOnTheBillLimit));
        setSimplesNacionalEnabled(settings.simplesNacionalEnabled);
        setTaxPercent(String(settings.taxPercent));
        setTaxDeduction(String(settings.taxDeduction));
      })
      .catch(() => {
        toast.error("Erro ao carregar configurações.");
      })
      .finally(() => setLoading(false));

    getPointsConfig()
      .then((config) => setMaxCashbackPercent(config.settings.maxCashbackPercent))
      // Programa de pontos indisponível: o bloco simplesmente não aparece.
      .catch(() => setMaxCashbackPercent(null));
  }, []);

  const handleSave = async () => {
    const start = Number(nightPriceStartHour);
    const end = Number(nightPriceEndHour);
    const nightMarkup = Number(nightPriceMarkupPercent);
    const ifoodMarkup = Number(ifoodMarkupPercent);
    const freight = Number(freightPrice);
    const creditFee = Number(creditCardFeePercent);
    const debitFee = Number(debitCardFeePercent);
    const pixFee = Number(pixFeePercent);
    const billLimit = Number(defaultOnTheBillLimit);
    const tax = Number(taxPercent);
    const deduction = Number(taxDeduction);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      start > 23 ||
      end < 0 ||
      end > 23
    ) {
      toast.error("Informe horas válidas, entre 0 e 23.");
      return;
    }

    if (
      Number.isNaN(nightMarkup) ||
      Number.isNaN(ifoodMarkup) ||
      nightMarkup < 0 ||
      ifoodMarkup < 0
    ) {
      toast.error("Informe porcentagens válidas.");
      return;
    }

    if (Number.isNaN(freight) || freight < 0) {
      toast.error("Informe um valor de frete válido.");
      return;
    }

    if (
      Number.isNaN(creditFee) ||
      Number.isNaN(debitFee) ||
      Number.isNaN(pixFee) ||
      creditFee < 0 ||
      debitFee < 0 ||
      pixFee < 0
    ) {
      toast.error("Informe taxas de pagamento válidas.");
      return;
    }

    // Só valida o imposto quando o Simples está ligado — desligado, os
    // campos ficam desabilitados e o valor deles não vai a lugar nenhum.
    if (
      simplesNacionalEnabled &&
      (Number.isNaN(tax) ||
        Number.isNaN(deduction) ||
        tax < 0 ||
        tax > 100 ||
        deduction < 0)
    ) {
      toast.error(
        "Informe uma alíquota entre 0 e 100 e uma parcela a deduzir válida.",
      );
      return;
    }

    if (Number.isNaN(billLimit) || billLimit < 0) {
      toast.error("Informe um limite de notinha válido.");
      return;
    }

    if (!city.trim() || !state.trim()) {
      toast.error("Informe a cidade e o estado da loja.");
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        autoScheduleEnabled,
        nightPriceEnabled,
        nightPriceStartHour: start,
        nightPriceEndHour: end,
        nightPriceMarkupPercent: nightMarkup,
        ifoodMarkupPercent: ifoodMarkup,
        freightPrice: freight,
        deliveryEnabled,
        oneManArmyMode,
        city: city.trim(),
        state: state.trim(),
        creditCardFeePercent: creditFee,
        debitCardFeePercent: debitFee,
        pixFeePercent: pixFee,
        defaultOnTheBillLimit: billLimit,
        simplesNacionalEnabled,
        taxPercent: tax,
        taxDeduction: deduction,
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (user && user.role !== "Admin") {
    return (
      <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
        <SideBar />
        <div className="flex flex-1 items-center justify-center rounded-md border border-black bg-white">
          <p className="text-gray-500">
            Você não tem permissão para acessar essa página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white">
        <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <SettingsIcon className="h-6 w-6" />
              Configurações
            </h1>
            <p className="text-gray-600">Manutenção geral do site</p>
          </div>

          {/* Abre em outra aba: dá pra mexer numa configuração aqui e
              conferir o resultado na loja sem perder esta tela. */}
          <a
            href="/?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary hover:text-white"
          >
            <Store className="h-4 w-4" />
            Ver como cliente
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </div>
          ) : (
            <div className="max-w-md space-y-8 rounded-lg border bg-white p-6 shadow-sm">
              {/* Status manual da loja */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Status da loja
                  </h2>
                  <p className="text-sm text-gray-500">
                    Abra ou feche a loja manualmente a qualquer momento.
                  </p>
                </div>
                <StoreStatusToggle />
              </div>

              <hr />

              {/* Horário automático de funcionamento */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Horário de funcionamento
                  </h2>
                  <p className="text-sm text-gray-500">
                    Abre e fecha a loja sozinha nos horários de cada dia da
                    semana, bloqueando pedidos de clientes fora da janela. O
                    Admin sempre pode vender, mesmo com a loja fechada.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoScheduleEnabled}
                    onChange={(e) => setAutoScheduleEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Abrir e fechar automaticamente
                </label>

                {!autoScheduleEnabled && (
                  <p className="rounded-md bg-gray-100 p-2 text-xs text-gray-600">
                    Desmarcado, a loja só abre e fecha pelo{" "}
                    <strong>botão de energia</strong> ali em cima — a grade
                    abaixo fica guardada, mas não age sozinha.
                  </p>
                )}

                <WeeklyScheduleEditor enabled={autoScheduleEnabled} />

                {autoScheduleEnabled && (
                  <p className="rounded-md bg-yellow-100 p-2 text-xs text-yellow-800">
                    <strong>Autonomia total:</strong> mesmo com a grade
                    ligada, o botão de energia lá em cima força a abertura ou
                    o fechamento na hora. A intervenção vale até a próxima
                    virada da grade e depois some sozinha — ou você desfaz
                    antes em &quot;Voltar ao automático&quot;.
                  </p>
                )}
              </div>

              <hr />

              {/* Preço noturno */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Preço noturno
                  </h2>
                  <p className="text-sm text-gray-500">
                    Acréscimo aplicado automaticamente ao preço normal fora do
                    horário comercial.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={nightPriceEnabled}
                    onChange={(e) => setNightPriceEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Aplicar preço noturno
                </label>

                <fieldset
                  disabled={!nightPriceEnabled}
                  className="space-y-4 disabled:opacity-50"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nightPriceStartHour">
                        Começa às (hora)
                      </Label>
                      <Input
                        id="nightPriceStartHour"
                        type="number"
                        min={0}
                        max={23}
                        value={nightPriceStartHour}
                        onChange={(e) =>
                          setNightPriceStartHour(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nightPriceEndHour">
                        Termina às (hora)
                      </Label>
                      <Input
                        id="nightPriceEndHour"
                        type="number"
                        min={0}
                        max={23}
                        value={nightPriceEndHour}
                        onChange={(e) => setNightPriceEndHour(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Use 0-23. Se a hora final for menor que a inicial (ex: 23
                    → 7), o período cruza a meia-noite.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="nightPriceMarkupPercent">
                      Acréscimo noturno (%)
                    </Label>
                    <Input
                      id="nightPriceMarkupPercent"
                      type="number"
                      min={0}
                      max={99}
                      step="0.01"
                      value={nightPriceMarkupPercent}
                      onChange={(e) =>
                        setNightPriceMarkupPercent(e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-400">
                      Usado para pré-calcular o preço noturno de um produto
                      quando o preço normal dele é definido pela primeira
                      vez. Depois disso, dá pra ajustar cada produto
                      manualmente em Catálogo → Editar Preços.
                    </p>
                  </div>
                </fieldset>
              </div>

              <hr />

              {/* Preço iFood */}
              <div className="space-y-2">
                <h2 className="font-semibold text-gray-900">Preço iFood</h2>
                <p className="text-sm text-gray-500">
                  Comissão do iFood a embutir no preço para esse canal.
                </p>
                <Label htmlFor="ifoodMarkupPercent">Comissão iFood (%)</Label>
                <Input
                  id="ifoodMarkupPercent"
                  type="number"
                  min={0}
                  max={99}
                  step="0.01"
                  value={ifoodMarkupPercent}
                  onChange={(e) => setIfoodMarkupPercent(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Mesma regra: só pré-calcula o preço na criação. Pode ser
                  ajustado por produto depois.
                </p>
              </div>

              <hr />

              {/* Delivery e frete */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Delivery</h2>
                  <p className="text-sm text-gray-500">
                    Alguns estabelecimentos não fazem entrega. Desmarcando,
                    a opção de delivery some da tela de Nova Venda.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Permitir delivery
                </label>

                <fieldset
                  disabled={!deliveryEnabled}
                  className="space-y-4 disabled:opacity-50"
                >
                  <div className="space-y-2">
                    <Label htmlFor="freightPrice">Valor do frete (R$)</Label>
                    <Input
                      id="freightPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      value={freightPrice}
                      onChange={(e) => setFreightPrice(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-[1fr_80px] gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade da loja</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ituiutaba"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">UF</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="MG"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Usada pra centralizar o mapa de entregas e pra completar
                    os endereços dos pedidos ao montar a rota no Google Maps
                    (os pedidos guardam só rua, número e bairro).
                  </p>
                </fieldset>
              </div>

              <hr />

              {/* Exército de um homem só */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Exército de um homem só
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pra quando você toca a loja sozinho, sem motoboy
                    cadastrado ainda. Com isso ligado, no Kanban de Pedidos
                    (coluna "Pronto"), o seletor de motoboy já vem
                    pré-preenchido com você mesmo (Admin) — é só clicar em
                    "Enviar".
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={oneManArmyMode}
                    onChange={(e) => setOneManArmyMode(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Ativar exército de um homem só
                </label>

                {oneManArmyMode && (
                  <p className="rounded-md bg-yellow-100 p-2 text-xs text-yellow-800">
                    <strong>Se deixar ligado:</strong> todo pedido de delivery
                    marcado como pronto vai aparecer com você já
                    pré-selecionado como entregador, então cuidado pra não
                    clicar "Enviar" sem querer e o pedido ficar
                    "atribuído" a você mesmo quando na verdade quem vai
                    entregar é outra pessoa. Assim que cadastrar motoboys de
                    verdade, desative essa opção — sem ela, o seletor volta a
                    ficar vazio por padrão e você escolhe manualmente quem
                    leva cada pedido.
                  </p>
                )}
              </div>

              <hr />

              {/* Taxas de pagamento */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Taxas de pagamento
                  </h2>
                  <p className="text-sm text-gray-500">
                    % cobrada pela maquininha/operadora em cada forma de
                    pagamento. É descontada do valor da venda para chegar no
                    faturamento líquido — R$ 100 no crédito a 3% viram R$ 97
                    no caixa. A taxa é congelada no momento do recebimento,
                    então mudar aqui não altera vendas já registradas.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="creditCardFeePercent" className="text-xs">
                      Crédito (%)
                    </Label>
                    <Input
                      id="creditCardFeePercent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={creditCardFeePercent}
                      onChange={(e) =>
                        setCreditCardFeePercent(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="debitCardFeePercent" className="text-xs">
                      Débito (%)
                    </Label>
                    <Input
                      id="debitCardFeePercent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={debitCardFeePercent}
                      onChange={(e) => setDebitCardFeePercent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pixFeePercent" className="text-xs">
                      Pix (%)
                    </Label>
                    <Input
                      id="pixFeePercent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={pixFeePercent}
                      onChange={(e) => setPixFeePercent(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Limite padrao de notinha */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Limite de notinha
                  </h2>
                  <p className="text-sm text-gray-500">
                    Quanto um cliente autorizado pode acumular em aberto. Vale
                    para quem não tem limite próprio — alterar aqui atinge
                    todos eles de uma vez. Para dar mais (ou menos) a alguém
                    específico, ajuste na aba <strong>Usuários</strong>.
                  </p>
                </div>

                <div className="max-w-[200px] space-y-1">
                  <Label htmlFor="defaultOnTheBillLimit" className="text-xs">
                    Limite padrão (R$)
                  </Label>
                  <Input
                    id="defaultOnTheBillLimit"
                    type="number"
                    min={0}
                    step="0.01"
                    value={defaultOnTheBillLimit}
                    onChange={(e) => setDefaultOnTheBillLimit(e.target.value)}
                  />
                </div>

                <p className="rounded-md bg-gray-100 p-2 text-xs text-gray-600">
                  Chegando no limite, a opção &quot;Notinha&quot; some do
                  checkout do cliente e ele só vê as outras formas de
                  pagamento. Volta a aparecer sozinha quando a conta é quitada.
                </p>
              </div>

              <hr />

              {/* Imposto sobre vendas (Simples Nacional) */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Imposto sobre vendas
                  </h2>
                  <p className="text-sm text-gray-500">
                    Diferente das taxas de cartão, o imposto{" "}
                    <strong>não é aplicado em cada venda</strong> — ele é
                    apurado só no fechamento do mês e aparece na DRE, dentro
                    do Financeiro.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={simplesNacionalEnabled}
                    onChange={(e) =>
                      setSimplesNacionalEnabled(e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  Empresa optante pelo Simples Nacional
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="taxPercent" className="text-xs">
                      Alíquota nominal (%)
                    </Label>
                    <Input
                      id="taxPercent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      disabled={!simplesNacionalEnabled}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="taxDeduction" className="text-xs">
                      Parcela a deduzir (R$)
                    </Label>
                    <Input
                      id="taxDeduction"
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={!simplesNacionalEnabled}
                      value={taxDeduction}
                      onChange={(e) => setTaxDeduction(e.target.value)}
                      className="disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {simplesNacionalEnabled ? (
                  <p className="rounded-md bg-blue-50 p-2 text-xs text-blue-900">
                    Os dois valores vêm da <strong>faixa do seu anexo</strong>{" "}
                    na tabela do Simples. A alíquota nominal não é a que se
                    paga: a DRE calcula a{" "}
                    <strong>alíquota efetiva</strong> pela fórmula oficial —
                    (RBT12 × alíquota − parcela a deduzir) ÷ RBT12 — onde
                    RBT12 é a receita dos 12 meses anteriores. Se a loja tem
                    menos de 12 meses, a receita é proporcionalizada, como
                    manda a regra.
                  </p>
                ) : (
                  <p className="rounded-md bg-gray-100 p-2 text-xs text-gray-600">
                    Sem o Simples marcado, a linha{" "}
                    <strong>&quot;Imposto sobre vendas&quot;</strong> da DRE
                    fica zerada. Ela continua aparecendo, pra ficar claro que
                    foi uma escolha e não um esquecimento.
                  </p>
                )}
              </div>

              {maxCashbackPercent !== null && (
                <>
                  <hr />

                  <div className="space-y-2">
                    <h2 className="font-semibold text-gray-900">
                      Distribuição máxima de cashback
                    </h2>
                    <p className="text-sm text-gray-500">
                      Teto do programa de pontos, em % da receita de produtos.
                      Representa o lucro líquido da empresa depois de todos os
                      gastos: distribuir acima dele quebra a operação no longo
                      prazo.
                    </p>

                    <div className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {maxCashbackPercent.toFixed(2)}%
                      </span>
                      <a
                        href="/admin/discount"
                        className="flex items-center gap-1.5 rounded-md border border-input bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary hover:text-white"
                      >
                        Ajustar em Promoções
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    </div>

                    <p className="text-xs text-gray-400">
                      O valor é editado junto com as regras de pontuação, em{" "}
                      <strong>Promoções &rarr; Pontos</strong>, onde o painel
                      compara esse teto com o que a configuração atual
                      realmente distribui.
                    </p>
                  </div>
                </>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-black text-white hover:bg-green-600"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
