export const transactionTypes = [
  { value: "Pix", label: "Pix" },
  { value: "Money", label: "Dinheiro" },
  { value: "DebitCard", label: "Cartão de Débito" },
  { value: "CreditCard", label: "Cartão de Crédito" },
  { value: "BankSlip", label: "Boleto Bancário" },
  { value: "OnTheBill", label: "Notinha" },
];

export const statusCheckout = [
  { value: "Pending", label: "Pendente" },
  { value: "Concluded", label: "Concluído" },
];

export type TransactionTypeValue = (typeof transactionTypes)[number]["value"];
export type StatusCheckoutValue = (typeof statusCheckout)[number]["value"];

export enum TransactionType {
  Pix = "Pix",
  Money = "Money",
  DebitCard = "DebitCard",
  CreditCard = "CreditCard",
  BankSlip = "BankSlip",
  OnTheBill = "OnTheBill",
}

export enum StatusCheckout {
  Pending = "Pending",
  Concluded = "Concluded",
}
