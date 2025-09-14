import { TransactionType } from "@/_constants";

export interface StockEntryDetailDto {
  productId: string;
  baseUnitCost: number;
  initialQuantity: number;
  totalProductCost: number;
  validityDate: string;
}

export interface StockEntryDetailProps extends StockEntryDetailDto {
  productName: string;
  imgUrl?: string;
}

export interface StockEntryDetailWithStock extends StockEntryDetailDto {
  id: string;
  stockTransactionId: string;
  quantityOnStock: number;
  productName: string;
  imgUrl?: string;
  product?: {
    id: string;
    name: string;
    imgUrl?: string;
  };
}

export interface CreateStockTransactionInstallmentDto {
  installmentNumber: number;
  dueDate: string;
  paidDate?: string;
  fragmentCost: number;
}

export interface StockTransactionInstallmentProps
  extends CreateStockTransactionInstallmentDto {
  id: string;
  stockTransactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockTransactionDto {
  supplierId: string;
  transactionType: TransactionType;
  nfeAccessKey?: string;
  numberPayments: number;
  firstPaymentDate?: string;
  totalProductCost: number;
  freightCost: number;
  feeCost: number;
  totalCost: number;
  stockEntryDetail: StockEntryDetailDto[];
  installments: CreateStockTransactionInstallmentDto[];
}

export interface StockTransactionProps
  extends Omit<CreateStockTransactionDto, "stockEntryDetail" | "installments"> {
  id: string;
  statusCheckout: "Pending" | "Concluded";
  createdAt: string;
  updatedAt: string;
  supplierName?: string;
  stockEntryDetail?: any[]; // Temporariamente any[] para debug
  stockEntryDetails?: any[]; // Campo que vem do backend
  installments?: StockTransactionInstallmentProps[];
}
