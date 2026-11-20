"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Competence,
  FIXED_EXPENSE_TYPES,
  IncomeStatement,
  getAvailableMonths,
  getIncomeStatement,
} from "@/api/finance";
import CompetenceSelect from "../_components/CompetenceSelect";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatPercent = (value: number): string =>
  `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const expenseLabel = (type: string) =>
  FIXED_EXPENSE_TYPES.find((option) => option.value === type)?.label ?? type;

/** Uma linha da DRE. `level` controla o recuo e o peso visual. */
interface LineProps {
  label: string;
  value: number;
  /** "deduction" mostra o valor entre parênteses, como negativo contábil. */
  kind?: "revenue" | "deduction" | "subtotal" | "result";
  hint?: string;
  indent?: boolean;
}

const StatementLine = ({
  label,
  value,
  kind = "revenue",
  hint,
  indent = false,
}: LineProps) => {
  const isDeduction = kind === "deduction";
  const isSubtotal = kind === "subtotal";
  const isResult = kind === "result";

  const rowClass = isResult
    ? "border-t-2 border-gray-900 bg-gray-50 font-bold"
    : isSubtotal
      ? "border-t font-semibold"
      : "border-b border-gray-100";

  // Prejuízo em vermelho; o resto segue neutro. Dedução em cinza porque é
  // sempre negativa — colorir tudo de vermelho tiraria o destaque do que
  // realmente importa, que é o resultado final.
  const valueClass = isResult
    ? value < 0
      ? "text-red-600"
      : "text-green-600"
    : isDeduction
      ? "text-gray-500"
      : "text-gray-900";

  return (
    <tr className={rowClass}>
      <td className={`py-2 ${indent ? "pl-6" : "pl-2"}`}>
        <span className={isResult || isSubtotal ? "" : "text-gray-700"}>
          {isDeduction ? "(−) " : ""}
          {label}
        </span>
        {hint && (
          <span className="ml-2 text-[11px] text-gray-400">{hint}</span>
        )}
      </td>
      <td className={`py-2 pr-2 text-right tabular-nums ${valueClass}`}>
        {isDeduction
          ? `(${formatCurrency(value)})`
          : formatCurrency(value)}
      </td>
    </tr>
  );
};

const DreTab = () => {
  const now = new Date();
  const [competence, setCompetence] = useState<Competence>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [months, setMonths] = useState<Competence[]>([]);
  const [statement, setStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableMonths()
      .then(setMonths)
      .catch(() => toast.error("Erro ao carregar as competências."));
  }, []);

  useEffect(() => {
    setLoading(true);
    getIncomeStatement(competence.year, competence.month)
      .then(setStatement)
      .catch(() => toast.error("Erro ao apurar o mês."))
      .finally(() => setLoading(false));
  }, [competence]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            DRE — Demonstração do Resultado
          </h1>
          <p className="text-xs text-gray-500">
            Apuração pelo regime de caixa: a venda entra no mês em que foi
            recebida, não em que a mercadoria saiu.
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
          Apurando...
        </div>
      ) : !statement ? (
        <p className="text-sm text-gray-400">Não foi possível apurar o mês.</p>
      ) : (
        <div className="max-w-2xl">
          <table className="w-full text-sm">
            <tbody>
              <StatementLine
                label="Receita Bruta de Vendas"
                value={statement.grossRevenue}
                hint={`${statement.orderCount} venda(s)`}
              />
              <StatementLine
                label="dos quais entregas (frete)"
                value={statement.freightRevenue}
                indent
                hint="já incluso acima"
              />

              <StatementLine
                label="Taxas de cartão"
                value={statement.cardFees}
                kind="deduction"
              />
              <StatementLine
                label="Imposto sobre vendas"
                value={statement.salesTax}
                kind="deduction"
                hint={
                  statement.tax.simplesNacionalEnabled
                    ? `Simples · efetiva ${formatPercent(statement.tax.effectiveRatePercent)}`
                    : "Simples Nacional desligado"
                }
              />
              <StatementLine
                label="Receita Líquida"
                value={statement.netRevenue}
                kind="subtotal"
              />

              <StatementLine
                label="CMV — custo das mercadorias vendidas"
                value={statement.costOfGoods}
                kind="deduction"
              />
              <StatementLine
                label="Lucro Bruto"
                value={statement.grossProfit}
                kind="subtotal"
                hint={formatPercent(statement.margins.grossProfitPercent)}
              />

              {statement.fixedExpenses.length === 0 ? (
                <StatementLine
                  label="Despesas fixas"
                  value={0}
                  kind="deduction"
                  hint="nenhuma lançada neste mês"
                />
              ) : (
                <>
                  {statement.fixedExpenses.map((expense) => (
                    <StatementLine
                      key={expense.id}
                      label={expenseLabel(expense.type)}
                      value={expense.amount}
                      kind="deduction"
                      indent
                    />
                  ))}
                  <StatementLine
                    label="Total de despesas fixas"
                    value={statement.fixedExpensesTotal}
                    kind="deduction"
                  />
                </>
              )}

              <StatementLine
                label="LUCRO LÍQUIDO"
                value={statement.netProfit}
                kind="result"
                hint={formatPercent(statement.margins.netProfitPercent)}
              />
            </tbody>
          </table>

          {statement.tax.simplesNacionalEnabled && (
            <p className="mt-3 rounded-md bg-blue-50 p-2 text-xs text-blue-900">
              Imposto calculado sobre uma RBT12 de{" "}
              <strong>{formatCurrency(statement.tax.rbt12)}</strong> com
              alíquota nominal de{" "}
              {formatPercent(statement.tax.nominalRatePercent)} e parcela a
              deduzir de {formatCurrency(statement.tax.deduction)}, resultando
              em alíquota efetiva de{" "}
              <strong>
                {formatPercent(statement.tax.effectiveRatePercent)}
              </strong>
              .
            </p>
          )}

          <p className="mt-3 text-[11px] text-gray-400">
            Ainda fora desta apuração: perdas de estoque, pró-labore,
            depreciação e demais despesas variáveis.
          </p>
        </div>
      )}
    </div>
  );
};

export default DreTab;
