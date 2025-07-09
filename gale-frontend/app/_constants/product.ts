export const categoryMap = {
  Beers: "Cervejas",
  Tobacco: "Tabacaria",
  NonAlcoholic: "Não alcoólico",
  Spirits: "Destilados",
  Candy: "Doces",
  FrozenFoods: "Congelados",
  PharmacyPersonalCare: "Farmácia e cuidados pessoais",
  Grocery: "Mercado",
  Wines: "Vinhos",
  Snacks: "Salgadinhos",
  Others: "Outros",
} as const;

export type CategoryType = keyof typeof categoryMap;
export const categoryOptions = Object.keys(categoryMap) as Array<keyof typeof categoryMap>;

export function translateCategory(category: string): string {
  return categoryMap[category as CategoryType] || category;
}

export const sizeTypeMap = {
  g: "Grama",
  L: "Litro",
  ml: "Mililitro",
  mg: "Miligramas",
  kg: "Quilograma",
  un: "Unidade",
};

export const sizeTypeOptions = Object.keys(
  sizeTypeMap,
) as (keyof typeof sizeTypeMap)[];
export type SizeType = (typeof sizeTypeOptions)[number];

export function translateSizeType(sizeType: string): string {
  return sizeTypeMap[sizeType as SizeType] || sizeType;
}
