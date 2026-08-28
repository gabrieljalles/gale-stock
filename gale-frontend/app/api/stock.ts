import { request } from "http";
import {
  CreateStockTransactionDto,
  StockEntryDetailProps,
  StockTransactionInstallmentProps,
  StockTransactionProps,
} from "@/_types";
import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

const STOCK_TRANSACTION_ENDPOINT = "/stock-transaction";

//Cria um novo estoque
export const createStock = async (data: CreateStockTransactionDto) => {
  const response = await requestWithAuth(() =>
    api.post(STOCK_TRANSACTION_ENDPOINT, data),
  );
  return response.data;
};

//Busca todos os estoques
export async function getStockTransactions(): Promise<StockTransactionProps[]> {
  const response = await requestWithAuth(() =>
    api.get(STOCK_TRANSACTION_ENDPOINT),
  );
  return response.data;
}

//Busca todos os parcelamentos
export async function getAllInstallments(): Promise<
  StockTransactionInstallmentProps[]
> {
  const response = await requestWithAuth(() =>
    api.get(`${STOCK_TRANSACTION_ENDPOINT}/installments`),
  );
  return response.data;
}

//Busca todos os produtos da transação
export async function getStockEntryDetails(): Promise<StockEntryDetailProps[]> {
  const response = await requestWithAuth(() =>
    api.get(`${STOCK_TRANSACTION_ENDPOINT}/product-details`),
  );
  return response.data;
}

//Busca todos os pagamentos do estoque
export async function getStockTransactionInstallments(
  transactionId: string,
): Promise<StockTransactionInstallmentProps[]> {
  const response = await requestWithAuth(() =>
    api.get(`${STOCK_TRANSACTION_ENDPOINT}/${transactionId}/installments`),
  );
  return response.data;
}

//Muda a parcela para paga.
export const updateInstallmentPaidDate = async (
  installmentId: string,
  paidDate: Date | null,
) => {
  const response = await requestWithAuth(() =>
    api.patch(`${STOCK_TRANSACTION_ENDPOINT}/installment/${installmentId}`, {
      paidDate,
    }),
  );
  return response.data;
};

//Deleta uma transação de estoque
export const deleteStockTransaction = async (transactionId: string) => {
  const response = await requestWithAuth(() =>
    api.delete(`${STOCK_TRANSACTION_ENDPOINT}/${transactionId}`),
  );
  return response.data;
};

//Corrige uma entrada de estoque (quantidade e/ou validade)
export const updateStockEntryDetail = async (
  entryId: string,
  data: { quantityOnStock?: number; validityDate?: string },
) => {
  const response = await requestWithAuth(() =>
    api.patch(`${STOCK_TRANSACTION_ENDPOINT}/entry-detail/${entryId}`, data),
  );
  return response.data;
};


