"use client";

import { useContext, useEffect, useState } from "react";
import SideBar from "@/admin/_components/SideBar";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/api/settings";
import { isAxiosError } from "axios";
import StoreStatusToggle from "../_components/StoreStatusToggle";

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
  const [storeCloseHour, setStoreCloseHour] = useState("22");
  const [nightPriceEnabled, setNightPriceEnabled] = useState(true);
  const [nightPriceStartHour, setNightPriceStartHour] = useState("23");
  const [nightPriceEndHour, setNightPriceEndHour] = useState("7");
  const [nightPriceMarkupPercent, setNightPriceMarkupPercent] = useState("5");
  const [ifoodMarkupPercent, setIfoodMarkupPercent] = useState("27");
  const [freightPrice, setFreightPrice] = useState("5");
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [creditCardFeePercent, setCreditCardFeePercent] = useState("0");
  const [debitCardFeePercent, setDebitCardFeePercent] = useState("0");
  const [pixFeePercent, setPixFeePercent] = useState("0");

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setAutoCloseEnabled(settings.autoCloseEnabled);
        setStoreCloseHour(String(settings.storeCloseHour));
        setNightPriceEnabled(settings.nightPriceEnabled);
        setNightPriceStartHour(String(settings.nightPriceStartHour));
        setNightPriceEndHour(String(settings.nightPriceEndHour));
        setNightPriceMarkupPercent(String(settings.nightPriceMarkupPercent));
        setIfoodMarkupPercent(String(settings.ifoodMarkupPercent));
        setFreightPrice(String(settings.freightPrice));
        setDeliveryEnabled(settings.deliveryEnabled);
        setCreditCardFeePercent(String(settings.creditCardFeePercent));
        setDebitCardFeePercent(String(settings.debitCardFeePercent));
        setPixFeePercent(String(settings.pixFeePercent));
      })
      .catch(() => {
        toast.error("Erro ao carregar configurações.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const closeHour = Number(storeCloseHour);
    const start = Number(nightPriceStartHour);
    const end = Number(nightPriceEndHour);
    const nightMarkup = Number(nightPriceMarkupPercent);
    const ifoodMarkup = Number(ifoodMarkupPercent);
    const freight = Number(freightPrice);
    const creditFee = Number(creditCardFeePercent);
    const debitFee = Number(debitCardFeePercent);
    const pixFee = Number(pixFeePercent);

    if (!Number.isInteger(closeHour) || closeHour < 0 || closeHour > 23) {
      toast.error("Informe uma hora de fechamento válida, entre 0 e 23.");
      return;
    }

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

    setSaving(true);
    try {
      await updateSettings({
        autoCloseEnabled,
        storeCloseHour: closeHour,
        nightPriceEnabled,
        nightPriceStartHour: start,
        nightPriceEndHour: end,
        nightPriceMarkupPercent: nightMarkup,
        ifoodMarkupPercent: ifoodMarkup,
        freightPrice: freight,
        deliveryEnabled,
        creditCardFeePercent: creditFee,
        debitCardFeePercent: debitFee,
        pixFeePercent: pixFee,
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
        <header className="flex-shrink-0 border-b px-6 py-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <SettingsIcon className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-gray-600">Manutenção geral do site</p>
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

              {/* Fechamento automático da loja */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Fechamento automático
                  </h2>
                  <p className="text-sm text-gray-500">
                    Fecha a loja sozinha depois do horário abaixo, bloqueando
                    novos pedidos de usuários comuns. Admin pode vender a
                    qualquer momento, mesmo com a loja fechada. O interruptor
                    manual acima sempre pode fechar antes disso.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoCloseEnabled}
                    onChange={(e) => setAutoCloseEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Fechar automaticamente
                </label>

                <fieldset
                  disabled={!autoCloseEnabled}
                  className="space-y-2 disabled:opacity-50"
                >
                  <Label htmlFor="storeCloseHour">Fecha às (hora)</Label>
                  <Input
                    id="storeCloseHour"
                    type="number"
                    min={0}
                    max={23}
                    value={storeCloseHour}
                    onChange={(e) => setStoreCloseHour(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Use 0-23. A loja reabre sozinha à meia-noite do dia
                    seguinte.
                  </p>
                </fieldset>
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
                  className="space-y-2 disabled:opacity-50"
                >
                  <Label htmlFor="freightPrice">Valor do frete (R$)</Label>
                  <Input
                    id="freightPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={freightPrice}
                    onChange={(e) => setFreightPrice(e.target.value)}
                  />
                </fieldset>
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
                    pagamento. Ainda não é descontada da venda automaticamente
                    — só fica salva aqui por enquanto.
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
