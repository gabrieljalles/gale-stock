"use client";
import {
  StockTransactionProps,
  StockTransactionInstallmentProps,
  StockEntryDetailWithStock,
} from "@/_types";
import {
  getStockTransactions,
  getAllInstallments,
  getStockEntryDetails,
  updateInstallmentPaidDate as updateInstallmentPaidDateAPI,
  deleteStockTransaction as deleteStockTransactionAPI,
} from "@/api/stock";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { toast } from "sonner";

interface InstallmentSummary {
  [transactionId: string]: {
    paid: number;
    total: number;
    installments: StockTransactionInstallmentProps[];
  };
}

interface StockTransactionContextType {
  stockTransactions: StockTransactionProps[] | null;
  installmentsSummary: InstallmentSummary;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  refresh: () => Promise<void>;
  loadPage: (page: number) => void;
  addStockTransaction: (transaction: StockTransactionProps) => void;
  removeStockTransaction: (id: string) => void;
  deleteStockTransaction: (id: string) => Promise<void>;
  updateStockTransaction: (
    id: string,
    transaction: Partial<StockTransactionProps>,
  ) => void;
  updateInstallmentPaidDate: (
    installmentId: string,
    paidDate: Date | null,
  ) => void;
  getTransactionInstallments: (
    transactionId: string,
  ) => StockTransactionInstallmentProps[];
  getProductsInStock: () => Promise<StockEntryDetailWithStock[]>;
}

const StockTransactionContext = createContext<StockTransactionContextType>({
  stockTransactions: null,
  installmentsSummary: {},
  loading: false,
  error: null,
  hasMore: false,
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  refresh: async () => {},
  loadPage: (page) => {},
  addStockTransaction: (t) => {},
  removeStockTransaction: (id) => {},
  deleteStockTransaction: async (id) => {},
  updateStockTransaction: (id, t) => {},
  updateInstallmentPaidDate: (id, date) => {},
  getTransactionInstallments: (id) => [],
  getProductsInStock: async () => [],
});

export function StockTransactionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [allTransactions, setAllTransactions] = useState<
    StockTransactionProps[] | null
  >(null);
  const [installmentsSummary, setInstallmentsSummary] =
    useState<InstallmentSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Calcular transações da página atual
  const stockTransactions = useMemo(() => {
    if (!allTransactions) return null;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return allTransactions.slice(startIndex, endIndex);
  }, [allTransactions, currentPage, itemsPerPage]);

  const fetch = async () => {
    setLoading(true);
    try {
      // Buscar transações e installments (os produtos já vêm nas transações)
      const [transactionsData, installmentsData] = await Promise.all([
        getStockTransactions(),
        getAllInstallments(),
      ]);

      console.log("Dados das transações:", transactionsData[0]);
      console.log(
        "StockEntryDetails da primeira transação:",
        transactionsData[0]?.stockEntryDetails,
      );

      // Mapear os dados para a estrutura esperada
      const mappedTransactions = transactionsData.map((transaction) => ({
        ...transaction,
        stockEntryDetail: transaction.stockEntryDetails || [],
      }));

      // As transações agora têm os produtos mapeados corretamente
      setAllTransactions(mappedTransactions);

      // Agrupar installments por transactionId
      const groupedInstallments = installmentsData.reduce(
        (acc, installment) => {
          const transactionId = installment.stockTransactionId;

          if (!acc[transactionId]) {
            acc[transactionId] = {
              paid: 0,
              total: 0,
              installments: [],
            };
          }

          acc[transactionId].installments.push(installment);
          acc[transactionId].total += 1;

          if (installment.paidDate) {
            acc[transactionId].paid += 1;
          }

          return acc;
        },
        {} as InstallmentSummary,
      );

      // Adicionar transações que não têm installments ainda
      transactionsData.forEach((transaction) => {
        if (!groupedInstallments[transaction.id]) {
          groupedInstallments[transaction.id] = {
            paid: 0,
            total: transaction.numberPayments,
            installments: [],
          };
        }
      });

      setInstallmentsSummary(groupedInstallments);

      // Por enquanto, simular paginação com dados locais
      // No futuro, isso virá da API
      const itemsPerPage = 10;
      setTotalPages(Math.ceil(transactionsData.length / itemsPerPage));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      // Por enquanto, apenas mudamos a página sem refazer o fetch
      // No futuro, aqui faria uma nova chamada à API com page/limit
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const addStockTransaction = (transaction: StockTransactionProps) => {
    setAllTransactions((prev) =>
      prev ? [transaction, ...prev] : [transaction],
    );

    // Verificar se é transação à vista (já paga)
    const isInstantPayment = ["DebitCard", "Money", "Pix"].includes(
      transaction.transactionType,
    );

    // Adicionar resumo da nova transação
    setInstallmentsSummary((prev) => ({
      ...prev,
      [transaction.id]: {
        paid: isInstantPayment ? transaction.numberPayments : 0,
        total: transaction.numberPayments,
        installments: [],
      },
    }));
  };

  const removeStockTransaction = (id: string) => {
    setAllTransactions((prev) => (prev ? prev.filter((t) => t.id !== id) : []));

    // Remover do resumo
    setInstallmentsSummary((prev) => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  const deleteStockTransaction = async (id: string) => {
    try {
      // Fazer a chamada da API para deletar no backend
      await deleteStockTransactionAPI(id);

      // Remover do estado local após sucesso da API
      removeStockTransaction(id);

      // Mostrar toast de sucesso
      toast.success("Transação deletada com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar transação:", error);

      // Mostrar toast de erro
      toast.error("Erro ao deletar transação", {
        description:
          "Não foi possível deletar a transação. Tente novamente.",
      });
    }
  };

  const updateStockTransaction = (
    id: string,
    updatedTransaction: Partial<StockTransactionProps>,
  ) => {
    setAllTransactions((prev) =>
      prev
        ? prev.map((t) => (t.id === id ? { ...t, ...updatedTransaction } : t))
        : [],
    );
  };

  const updateInstallmentPaidDate = async (
    installmentId: string,
    paidDate: Date | null,
  ) => {
    try {
      // Fazer a chamada da API para atualizar no backend
      await updateInstallmentPaidDateAPI(installmentId, paidDate);

      // Mostrar toast de sucesso
      if (paidDate) {
        toast.success("Parcela marcada como paga com sucesso!", {
          description: `Data de pagamento: ${paidDate.toLocaleDateString("pt-BR")}`,
        });
      } else {
        toast.success("Parcela desmarcada como paga com sucesso!");
      }

      // Atualizar o estado local após sucesso da API
      setInstallmentsSummary((prev) => {
        const newSummary = { ...prev };

        // Encontrar e atualizar o installment
        Object.keys(newSummary).forEach((transactionId) => {
          const summary = newSummary[transactionId];
          const installmentIndex = summary.installments.findIndex(
            (inst) => inst.id === installmentId,
          );

          if (installmentIndex !== -1) {
            // Criar nova cópia do installment
            const updatedInstallments = [...summary.installments];
            updatedInstallments[installmentIndex] = {
              ...updatedInstallments[installmentIndex],
              paidDate: paidDate ? paidDate.toISOString() : undefined,
            };

            // Recalcular contagem de pagos
            const paidCount = updatedInstallments.filter(
              (inst) => inst.paidDate !== null && inst.paidDate !== undefined,
            ).length;

            newSummary[transactionId] = {
              ...summary,
              installments: updatedInstallments,
              paid: paidCount,
            };
          }
        });

        return newSummary;
      });
    } catch (error) {
      console.error("Erro ao atualizar parcela:", error);

      // Mostrar toast de erro
      toast.error("Erro ao atualizar parcela", {
        description:
          "Não foi possível processar a solicitação. Tente novamente.",
      });
    }
  };

  const getTransactionInstallments = (
    transactionId: string,
  ): StockTransactionInstallmentProps[] => {
    return installmentsSummary[transactionId]?.installments || [];
  };

  const getProductsInStock = async (): Promise<StockEntryDetailWithStock[]> => {
    try {
      const allStockDetails = await getStockEntryDetails();
      
      // Filtrar apenas produtos com quantityOnStock > 0
      const productsInStock = allStockDetails.filter(
        (detail: any) => detail.quantityOnStock > 0
      );

      // Mapear para a interface StockEntryDetailWithStock
      return productsInStock.map((detail: any) => ({
        id: detail.id,
        stockTransactionId: detail.stockTransactionId,
        productId: detail.productId,
        baseUnitCost: detail.baseUnitCost,
        initialQuantity: detail.initialQuantity,
        quantityOnStock: detail.quantityOnStock,
        totalProductCost: detail.totalProductCost,
        validityDate: detail.validityDate,
        productName: detail.product?.name || "",
        imgUrl: detail.product?.imgUrl,
        product: detail.product,
      }));
    } catch (error) {
      console.error("Erro ao buscar produtos em estoque:", error);
      return [];
    }
  };

  return (
    <StockTransactionContext.Provider
      value={{
        stockTransactions,
        installmentsSummary,
        loading,
        error,
        hasMore: hasNextPage,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        addStockTransaction,
        removeStockTransaction,
        deleteStockTransaction,
        updateStockTransaction,
        updateInstallmentPaidDate,
        getTransactionInstallments,
        getProductsInStock,
        refresh: fetch,
        loadPage,
      }}
    >
      {children}
    </StockTransactionContext.Provider>
  );
}

export function useStockTransactions() {
  const ctx = useContext(StockTransactionContext);
  if (!ctx)
    throw new Error(
      "useStockTransactions must be used within a StockTransactionProvider",
    );
  return ctx;
}
