/**
 * Retorna o status de validade baseado na data de validade do produto
 * @param validityDate - Data de validade do produto (string ou null)
 * @returns Objeto com cor e dias até o vencimento
 */
export const getValidityStatus = (validityDate: string | null) => {
  if (!validityDate) return { color: "bg-gray-400", days: null };

  const validity = new Date(validityDate);
  const now = new Date();
  const diffTime = validity.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { color: "bg-black", days: "Vencido" }; // Vencido
  if (diffDays <= 3) return { color: "bg-red-900", days: diffDays }; // 3 dias ou menos - vermelho escuro
  if (diffDays <= 7) return { color: "bg-red-500", days: diffDays }; // 4-7 dias - vermelho
  if (diffDays <= 15) return { color: "bg-orange-500", days: diffDays }; // 8-15 dias - laranja
  if (diffDays <= 30) return { color: "bg-yellow-500", days: diffDays }; // 16-30 dias - amarelo
  return { color: "bg-green-500", days: diffDays > 30 ? "30+" : diffDays }; // Mais de 30 dias - verde
};

/**
 * Interface para o retorno da função getValidityStatus
 */
export interface ValidityStatusResult {
  color: string;
  days: number | string | null;
}
