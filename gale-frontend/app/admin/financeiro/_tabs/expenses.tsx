"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import {
  Competence,
  FIXED_EXPENSE_TYPES,
  FixedExpense,
  FixedExpenseType,
  deleteFixedExpense,
  formatCompetence,
  getAvailableMonths,
  getFixedExpenses,
  upsertFixedExpense,
} from "@/api/finance";
import CompetenceSelect from "../_components/CompetenceSelect";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const ExpensesTab = () => {
  const now = new Date();
  const [competence, setCompetence] = useState<Competence>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [months, setMonths] = useState<Competence[]>([]);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<FixedExpenseType | null>(null);

  // Rascunho por tipo: o input fica controlado enquanto a pessoa digita,
  // sem disparar requisição a cada tecla.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    getFixedExpenses(competence.year, competence.month)
      .then((data) => {
        setExpenses(data);
        setDrafts(
          Object.fromEntries(data.map((e) => [e.type, String(e.amount)])),
        );
      })
      .catch(() => toast.error("Erro ao carregar as despesas."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getAvailableMonths()
      .then(setMonths)
      .catch(() => toast.error("Erro ao carregar as competências."));
  }, []);

  useEffect(load, [competence]);

  const handleSave = async (type: FixedExpenseType) => {
    const raw = drafts[type];
    const amount = Number(raw);

    if (raw === undefined || raw === "" || Number.isNaN(amount) || amount < 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setSavingType(type);
    try {
      await upsertFixedExpense({
        type,
        referenceYear: competence.year,
        referenceMonth: competence.month,
        amount,
      });
      toast.success("Despesa salva!");
      load();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao salvar a despesa.");
    } finally {
      setSavingType(null);
    }
  };

  const handleDelete = async (expense: FixedExpense) => {
    try {
      await deleteFixedExpense(expense.id);
      toast.success("Despesa removida.");
      load();
    } catch {
      toast.error("Erro ao remover a despesa.");
    }
  };

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Despesas fixas</h1>
          <p className="text-xs text-gray-500">
            Lançadas no mês de <strong>competência</strong>: a energia de
            setembro é despesa de setembro, mesmo que a conta só seja paga em
            outubro.
          </p>
        </div>
        <CompetenceSelect
          months={months}
          value={competence}
          onChange={setCompetence}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : (
        <div className="max-w-xl space-y-2">
          {FIXED_EXPENSE_TYPES.map(({ value: type, label }) => {
            const saved = expenses.find((expense) => expense.type === type);
            const draft = drafts[type] ?? "";
            const isDirty = String(saved?.amount ?? "") !== draft;

            return (
              <div
                key={type}
                className="flex items-center gap-2 rounded-md border p-3"
              >
                <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-800">
                  {label}
                </span>

                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={draft}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [type]: event.target.value,
                    }))
                  }
                  className="flex-1"
                />

                <Button
                  type="button"
                  size="sm"
                  disabled={savingType === type || !isDirty}
                  onClick={() => handleSave(type)}
                  className="bg-black text-white hover:bg-green-600 disabled:opacity-40"
                >
                  {savingType === type ? "Salvando..." : "Salvar"}
                </Button>

                {saved && (
                  <button
                    type="button"
                    title="Remover lançamento deste mês"
                    onClick={() => handleDelete(saved)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between rounded-md bg-gray-50 p-3 text-sm font-semibold">
            <span className="text-gray-700">
              Total de {formatCompetence(competence)}
            </span>
            <span className="text-gray-900">{formatCurrency(total)}</span>
          </div>

          <p className="text-[11px] text-gray-400">
            Esse total é deduzido do Lucro Bruto na aba DRE, na mesma
            competência.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;
