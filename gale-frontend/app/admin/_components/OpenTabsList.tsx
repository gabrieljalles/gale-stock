"use client";

import { useMemo, useState } from "react";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Button } from "@/_components/ui/button";
import { useWorkDay } from "@/_store/workDay/WorkDayContext";
import { closeTab } from "@/api/order";
import { transactionTypes } from "@/_constants/transaction";

// Métodos de pagamento reais aceitos ao fechar a conta (não pode fechar
// uma notinha "com notinha").
const PAYMENT_METHODS = transactionTypes.filter(
  (t) => t.value !== "BankSlip" && t.value !== "OnTheBill",
);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatDateOnly = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));

const daysSince = (value: string): number => {
  const diffMs = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

// Quanto mais velha a notinha, mais chamativa a borda: 30+ dias avisa em
// amarelo, 60+ dias em vermelho.
const getAgeBorderClass = (days: number): string => {
  if (days >= 60) return "border-2 border-red-500";
  if (days >= 30) return "border-2 border-yellow-500";
  return "border";
};

const OpenTabsList = () => {
  const { openTabs, refresh } = useWorkDay();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(
    null,
  );
  const [closingClientId, setClosingClientId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(
    PAYMENT_METHODS[0].value,
  );
  const [interestInput, setInterestInput] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  // Mais antigas primeiro (quem foi aberta há mais tempo aparece no topo).
  const sortedTabs = useMemo(
    () =>
      [...openTabs].sort(
        (a, b) =>
          new Date(a.orders[0].createdAt).getTime() -
          new Date(b.orders[0].createdAt).getTime(),
      ),
    [openTabs],
  );

  if (openTabs.length === 0) return null;

  const handleStartClose = (clientId: string) => {
    setClosingClientId(clientId);
    setSelectedMethod(PAYMENT_METHODS[0].value);
    setInterestInput("0");
  };

  const handleConfirmClose = async (clientId: string) => {
    setSubmitting(true);
    try {
      const interestAmount = Number(interestInput) || 0;
      await closeTab(clientId, selectedMethod, interestAmount);
      toast.success("Conta fechada com sucesso!");
      setClosingClientId(null);
      refresh();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao fechar a conta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-shrink-0 rounded-md border border-blue-200 bg-blue-50 p-3 lg:w-64">
      <div className="mb-2 flex items-center justify-between gap-1.5 text-xs font-semibold text-blue-700">
        <span className="flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5" />
          Notinhas em aberto ({openTabs.length})
        </span>
        <span>
          {formatCurrency(openTabs.reduce((sum, tab) => sum + tab.total, 0))}
        </span>
      </div>

      <div className="max-h-96 space-y-1.5 overflow-y-auto">
        {sortedTabs.map((tab) => {
          const isExpanded = expandedClientId === tab.clientId;
          const isClosing = closingClientId === tab.clientId;
          const allProducts = tab.orders.flatMap((o) => o.products);
          const age = daysSince(tab.orders[0].createdAt);

          return (
            <div
              key={tab.clientId}
              className={`rounded-md bg-white p-2 text-xs ${getAgeBorderClass(age)}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="truncate font-medium text-gray-800"
                  title={tab.clientName}
                >
                  {tab.clientName}
                </span>
                <span className="flex-shrink-0 font-semibold text-blue-700">
                  {formatCurrency(tab.total)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">
                Aberta em {formatDateOnly(tab.orders[0].createdAt)} ({age})
              </p>

              <div className="mt-1.5 flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  className="h-6 flex-1 bg-black text-[11px] text-white hover:bg-green-600"
                  onClick={() => handleStartClose(tab.clientId)}
                >
                  Fechar conta
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedClientId(isExpanded ? null : tab.clientId)
                  }
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border text-gray-500 hover:bg-gray-50"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-1.5 space-y-1 border-t pt-1.5">
                  {allProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-1 text-gray-600"
                    >
                      <span className="truncate">
                        {product.productName} x{product.quantity}
                      </span>
                      <span className="flex-shrink-0">
                        {formatCurrency(product.totalPrice)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-1 font-semibold text-gray-800">
                    <span>Total</span>
                    <span>{formatCurrency(tab.total)}</span>
                  </div>
                  {tab.orders.length > 1 && (
                    <p className="text-[10px] text-gray-400">
                      {tab.orders.length} notinhas desde{" "}
                      {formatDateTime(tab.orders[0].createdAt)}
                    </p>
                  )}
                </div>
              )}

              {isClosing && (
                <div className="mt-1.5 space-y-1 border-t pt-1.5">
                  <label className="text-[10px] font-medium text-gray-600">
                    Como vai pagar?
                  </label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="h-6 w-full rounded border border-input bg-white px-1 text-[11px]"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>

                  {age >= 30 && (
                    <>
                      <label className="text-[10px] font-medium text-gray-600">
                        Multa por atraso (R$)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        placeholder="0,00"
                        className="h-6 w-full rounded border border-input bg-white px-1 text-[11px]"
                      />
                      <p className="text-[10px] text-gray-400">
                        Total com multa:{" "}
                        {formatCurrency(
                          tab.total + (Number(interestInput) || 0),
                        )}
                      </p>
                    </>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 flex-1 border border-green-600 bg-green-600 text-[11px] !text-white hover:bg-green-800"
                      disabled={submitting}
                      onClick={() => handleConfirmClose(tab.clientId)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 flex-1 text-[11px]"
                      onClick={() => setClosingClientId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OpenTabsList;
