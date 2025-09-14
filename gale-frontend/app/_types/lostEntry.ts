export interface LostEntryProps {
  id: string;
  productId: string;
  stockEntryDetailId: string;
  quantity: number;
  reasonLoss: ReasonLoss;
  note?: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    imgUrl: string;
  };
}

export interface CreateLostEntryDto {
  productId: string;
  validityDate?: string; // Data de validade opcional
  quantity: number;
  reasonLoss: ReasonLoss;
  note?: string;
}

export enum ReasonLoss {
  Theft = "Theft",
  DamagedProduct = "DamagedProduct",
  Expiration = "Expiration",
  Loss = "Loss",
}

export const reasonLossLabels: Record<ReasonLoss, string> = {
  [ReasonLoss.Theft]: "Furto",
  [ReasonLoss.DamagedProduct]: "Produto Danificado",
  [ReasonLoss.Expiration]: "Validade do Produto",
  [ReasonLoss.Loss]: "Perda",
};
