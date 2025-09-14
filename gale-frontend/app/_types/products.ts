import { CategoryType, SizeType } from "@/_constants/product";

export interface ProductProps {
  id: string;
  name: string;
  barCode?: string;
  description?: string;
  category: CategoryType;
  sizeType: SizeType;
  pack: number;
  size: string;
  imgUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
