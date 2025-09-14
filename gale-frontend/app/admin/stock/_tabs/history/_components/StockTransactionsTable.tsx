import { Button } from "@/_components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";
import { statusCheckout, transactionTypes } from "@/_constants";
import { useStockTransactions } from "@/_store/stock/StockTransactionContext";
import { useSuppliers } from "@/_store/supplier/SupplierContext";
import {
  BadgeInfo,
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Handshake,
  Package,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Fragment, useMemo, useState, useEffect } from "react";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";

const StockTransactionsTable = () => {
  const getTransactionTypeIcon = (transactionType: string) => {
    const iconProps = "h-4 w-4";

    switch (transactionType) {
      case "CreditCard":
        return <CreditCard className={`${iconProps} text-blue-600`} />;
      case "Money":
        return <Banknote className={`${iconProps} text-green-600`} />;
      case "BankSlip":
        return <StickyNote className={`${iconProps} text-yellow-600`} />;
      case "Pix":
        return <CircleDollarSign className={`${iconProps} text-black`} />;
      case "DebitCard":
        return <CreditCard className={`${iconProps} text-orange-600`} />;
      case "OnTheBill":
        return <Handshake className={`${iconProps} text-red-600`} />;
    }
  };

  const getTransactionTypeLabel = (transactionType: string) => {
    const type = transactionTypes.find((t) => t.value === transactionType);
    return type ? type.label : transactionType;
  };

  const getStatusLabel = (status: string) => {
    const statusItem = statusCheckout.find((s) => s.value === status);
    return statusItem ? statusItem.label : status;
  };

  const {
    stockTransactions,
    installmentsSummary,
    loading,
    error,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    loadPage,
    getTransactionInstallments,
    updateInstallmentPaidDate,
    deleteStockTransaction,
  } = useStockTransactions();
  const { suppliers } = useSuppliers();
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(
    null,
  );
  const [loadingInstallments, setLoadingInstallments] = useState<Set<string>>(
    new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const enrichedTransactions = useMemo(() => {
    if (!stockTransactions || !suppliers) return [];

    return stockTransactions.map((transaction) => ({
      ...transaction,
      supplierName:
        suppliers.find((s) => s.id === transaction.supplierId)?.enterprise ||
        "N/A",
      supplierImage:
        suppliers.find((s) => s.id === transaction.supplierId)?.imgUrl || null,
    }));
  }, [stockTransactions, suppliers]);

  // Debug: verificar estrutura dos dados
  useEffect(() => {
    if (enrichedTransactions && enrichedTransactions.length > 0) {
      console.log("Primeira transação:", enrichedTransactions[0]);
      console.log("Chaves da transação:", Object.keys(enrichedTransactions[0]));
      console.log(
        "stockEntryDetail:",
        enrichedTransactions[0].stockEntryDetail,
      );
      if (
        enrichedTransactions[0].stockEntryDetail &&
        enrichedTransactions[0].stockEntryDetail.length > 0
      ) {
        console.log(
          "Primeiro produto:",
          enrichedTransactions[0].stockEntryDetail[0],
        );
        console.log(
          "Chaves do produto:",
          Object.keys(enrichedTransactions[0].stockEntryDetail[0]),
        );
      }
    }
  }, [enrichedTransactions]);

  const handleToggleInstallments = (transactionId: string) => {
    if (expandedTransaction === transactionId) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(transactionId);
    }
  };

  const getPaidInstallmentsDisplay = (transaction: any) => {
    const summary = installmentsSummary[transaction.id];
    if (summary) {
      return `${summary.paid}/${summary.total}`;
    }
    return `0/${transaction.numberPayments}`;
  };

  const handlePaymentToggle = async (
    installmentId: string,
    currentPaidDate: string | undefined,
  ) => {
    setLoadingInstallments((prev) => new Set([...prev, installmentId]));

    try {
      await updateInstallmentPaidDate(
        installmentId,
        currentPaidDate ? null : new Date(),
      );
    } finally {
      setLoadingInstallments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(installmentId);
        return newSet;
      });
    }
  };

  const handleDeleteClick = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteStockTransaction(transactionToDelete);
    } finally {
      setIsDeleting(false);
      setTransactionToDelete(null);
    }
  };

  if (loading) return <div className="p-4">Carregando transações...</div>;
  if (error)
    return <div className="p-4 text-red-500"> Erro: {error.message}</div>;

  return (
    <div className="w-full space-y-4">
      <div>
        <div className="Pb-2 max-h-[530px] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Dt compra</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Info</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedTransactions?.map((transaction) => (
                <Fragment key={transaction.id}>
                  {/* Linha principal da transação */}
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.supplierName || ""}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.id.substring(0, 10)}...
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionTypeIcon(transaction.transactionType)}
                        {getTransactionTypeLabel(transaction.transactionType)}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      R$ {Number(transaction.totalCost).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "pt-BR",
                      )}
                    </TableCell>
                    <TableCell>
                      {getPaidInstallmentsDisplay(transaction)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.statusCheckout === "Concluded"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {getStatusLabel(transaction.statusCheckout)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleInstallments(transaction.id)}
                        className="flex items-center gap-2"
                      >
                        <BadgeInfo className="h-4 w-4" />
                        {expandedTransaction === transaction.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(transaction.id)}
                        className="flex items-center gap-2 text-black hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Linha expandida com parcelas */}
                  {expandedTransaction === transaction.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0">
                        <div className="border-t bg-gray-50">
                          <div className="space-y-6 p-4">
                            {/* Seção de Parcelas */}
                            <div>
                              <h4 className="mb-3 font-medium text-gray-700">
                                Parcelas da Transação
                              </h4>
                              <div className="space-y-1">
                                {getTransactionInstallments(transaction.id).map(
                                  (installment) => (
                                    <div
                                      key={installment.id}
                                      className="flex items-center justify-between rounded border bg-white p-2"
                                    >
                                      <div className="flex items-center gap-4">
                                        <span className="font-medium">
                                          Parcela{" "}
                                          {installment.installmentNumber}
                                        </span>
                                        <span className="text-gray-600">
                                          Vencimento:{" "}
                                          {new Date(
                                            installment.dueDate,
                                          ).toLocaleDateString("pt-BR")}
                                        </span>
                                        {installment.paidDate && (
                                          <span className="text-sm text-green-600">
                                            Pago em:{" "}
                                            {new Date(
                                              installment.paidDate,
                                            ).toLocaleDateString("pt-BR")}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="font-medium">
                                          R${" "}
                                          {Number(
                                            installment.fragmentCost,
                                          ).toFixed(2)}
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            installment.paidDate
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {installment.paidDate
                                            ? "Pago"
                                            : "Pendente"}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handlePaymentToggle(
                                              installment.id,
                                              installment.paidDate,
                                            )
                                          }
                                          disabled={loadingInstallments.has(
                                            installment.id,
                                          )}
                                        >
                                          {loadingInstallments.has(
                                            installment.id,
                                          )
                                            ? "Processando..."
                                            : installment.paidDate
                                              ? "Desmarcar"
                                              : "Marcar Pago"}
                                        </Button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Seção de Produtos */}
                            <div>
                              <h4 className="mb-3 font-medium text-gray-700">
                                Produtos Comprados
                              </h4>
                              <div className="space-y-1">
                                {transaction.stockEntryDetail &&
                                transaction.stockEntryDetail.length > 0 ? (
                                  transaction.stockEntryDetail.map(
                                    (product, index) => (
                                      <div
                                        key={product.id || index}
                                        className="flex items-center justify-between rounded border bg-white p-3"
                                      >
                                        <div className="flex items-center gap-4">
                                          {/* Imagem do produto */}
                                          <div className="h-6 w-6 flex-shrink-0">
                                            {product.product?.imgUrl ? (
                                              <img
                                                src={product.product.imgUrl}
                                                alt={product.product.name}
                                                className="h-6 w-6 rounded object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                                                <Package className="h-6 w-6 text-gray-400" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Informações do produto */}
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                              {product.product?.name ||
                                                "Produto não encontrado"}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                              <span>
                                                Preço de custo: R${" "}
                                                {Number(
                                                  product.baseUnitCost,
                                                ).toFixed(4)}
                                              </span>
                                              <span>
                                                Preço real: R${" "}
                                                {Number(
                                                  product.landedUnitCost ||
                                                    product.baseUnitCost,
                                                ).toFixed(4)}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                Validade:{" "}
                                                {product.validityDate ? (
                                                  <>
                                                    <span
                                                      className={`inline-flex h-2 w-2 rounded-full ${(() => {
                                                        const validityDate =
                                                          new Date(
                                                            product.validityDate,
                                                          );
                                                        const now = new Date();
                                                        const diffTime =
                                                          validityDate.getTime() -
                                                          now.getTime();
                                                        const diffDays =
                                                          Math.ceil(
                                                            diffTime /
                                                              (1000 *
                                                                60 *
                                                                60 *
                                                                24),
                                                          );

                                                        if (diffDays < 0)
                                                          return "bg-red-500"; // Vencido
                                                        if (diffDays <= 7)
                                                          return "bg-red-500"; // Vence em 7 dias ou menos
                                                        if (diffDays <= 30)
                                                          return "bg-yellow-500"; // Vence em 30 dias ou menos
                                                        return "bg-green-500"; // Mais de 30 dias
                                                      })()}`}
                                                    ></span>
                                                    {new Date(
                                                      product.validityDate,
                                                    ).toLocaleDateString(
                                                      "pt-BR",
                                                    )}
                                                  </>
                                                ) : (
                                                  "N/A"
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Quantidade e custo total */}
                                        <div className="flex items-center gap-4 text-right">
                                          <div className="flex flex-col items-center justify-center">
                                            <div className="text-sm text-gray-600">
                                              Qtd comprada
                                            </div>
                                            <div>{product.initialQuantity}</div>
                                          </div>
                                          <div>
                                            <div className="text-sm text-gray-600">
                                              Custo Total
                                            </div>
                                            <div className="font-medium">
                                              R${" "}
                                              {Number(
                                                product.totalProductCost,
                                              ).toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )
                                ) : (
                                  <div className="rounded border bg-white p-3 text-center text-gray-500">
                                    Nenhum produto encontrado para esta
                                    transação
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Controles de Paginação - Pequenos no canto direito */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 text-sm">
          <span className="mr-2 text-gray-600">
            {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(currentPage + 1)}
            disabled={!hasNextPage}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação de deleção */}
      <DeleteTransactionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        transactionId={transactionToDelete || ""}
      />
    </div>
  );
};

export default StockTransactionsTable;
