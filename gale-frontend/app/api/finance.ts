import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

export type FixedExpenseType = "Energy" | "Water" | "Rent";

export const FIXED_EXPENSE_TYPES: {
  value: FixedExpenseType;
  label: string;
}[] = [
  { value: "Energy", label: "Energia" },
  { value: "Water", label: "Água" },
  { value: "Rent", label: "Aluguel" },
];

export interface FixedExpense {
  id: string;
  type: FixedExpenseType;
  referenceYear: number;
  referenceMonth: number;
  amount: number;
  note: string | null;
}

export interface Competence {
  year: number;
  month: number;
}

export interface IncomeStatement {
  year: number;
  month: number;
  orderCount: number;

  grossRevenue: number;
  freightRevenue: number;
  interestRevenue: number;

  cardFees: number;
  salesTax: number;
  netRevenue: number;

  costOfGoods: number;
  grossProfit: number;

  fixedExpenses: {
    id: string;
    type: FixedExpenseType;
    amount: number;
    note: string | null;
  }[];
  fixedExpensesTotal: number;

  netProfit: number;

  tax: {
    simplesNacionalEnabled: boolean;
    nominalRatePercent: number;
    deduction: number;
    effectiveRatePercent: number;
    rbt12: number;
  };

  margins: {
    grossProfitPercent: number;
    netProfitPercent: number;
  };
}

export const getAvailableMonths = async (): Promise<Competence[]> => {
  const response = await requestWithAuth(() => api.get("/finance/months"));
  return response.data;
};

export const getIncomeStatement = async (
  year: number,
  month: number,
): Promise<IncomeStatement> => {
  const response = await requestWithAuth(() =>
    api.get("/finance/income-statement", { params: { year, month } }),
  );
  return response.data;
};

export const getFixedExpenses = async (
  year: number,
  month: number,
): Promise<FixedExpense[]> => {
  const response = await requestWithAuth(() =>
    api.get("/finance/expenses", { params: { year, month } }),
  );
  return response.data;
};

export const upsertFixedExpense = async (payload: {
  type: FixedExpenseType;
  referenceYear: number;
  referenceMonth: number;
  amount: number;
  note?: string;
}): Promise<{ id: string; amount: number }> => {
  const response = await requestWithAuth(() =>
    api.post("/finance/expenses", payload),
  );
  return response.data;
};

export const deleteFixedExpense = async (id: string): Promise<void> => {
  await requestWithAuth(() => api.delete(`/finance/expenses/${id}`));
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const formatCompetence = ({ year, month }: Competence): string =>
  `${MONTH_NAMES[month - 1]} de ${year}`;
