import { Button } from "@/_components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";
import { ReasonLoss, reasonLossLabels, LostEntryProps } from "@/_types";
import {
  AlertTriangle,
  Calendar,
  FileWarning,
  Package,
  ShieldAlert,
  ShieldQuestion,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getLostEntries, deleteLostEntry } from "@/api/lostEntry";

// Dialog de confirmação de deleção
interface DeleteLossDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  lossId: string;
}

const DeleteLossDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  lossId,
}: DeleteLossDialogProps) => {
  return (
    <div
      className={`fixed inset-0 z-50 ${
        open ? "block" : "hidden"
      } flex items-center justify-center bg-black bg-opacity-50`}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar Exclusão
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Tem certeza que deseja excluir esta perda? Esta ação não pode ser
            desfeita e o estoque será restaurado.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const LostEntriesTable = () => {
  const [lostEntries, setLostEntries] = useState<LostEntryProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lossToDelete, setLossToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para obter ícone do motivo da perda
  const getReasonLossIcon = (reasonLoss: ReasonLoss) => {
    const iconProps = "h-4 w-4";

    switch (reasonLoss) {
      case ReasonLoss.Theft:
        return <ShieldAlert className={`${iconProps} text-red-600`} />;
      case ReasonLoss.DamagedProduct:
        return <AlertTriangle className={`${iconProps} text-orange-600`} />;
      case ReasonLoss.Expiration:
        return <Calendar className={`${iconProps} text-purple-600`} />;
      case ReasonLoss.Loss:
        return <ShieldQuestion className={`${iconProps} text-yellow-600`} />;
      default:
        return <FileWarning className={`${iconProps} text-gray-600`} />;
    }
  };

  // Buscar perdas
  const fetchLostEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLostEntries();
      setLostEntries(data);
    } catch (error) {
      console.error("Erro ao buscar perdas:", error);
      setError("Erro ao carregar perdas de produtos");
      toast.error("Erro ao carregar perdas de produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLostEntries();
  }, []);

  // Confirmar exclusão
  const handleDeleteClick = (lossId: string) => {
    setLossToDelete(lossId);
    setDeleteDialogOpen(true);
  };

  // Excluir perda
  const handleDeleteConfirm = async () => {
    if (!lossToDelete) return;

    setIsDeleting(true);
    try {
      await deleteLostEntry(lossToDelete);
      toast.success("Perda excluída com sucesso!");
      await fetchLostEntries(); // Recarregar lista
    } catch (error) {
      console.error("Erro ao excluir perda:", error);
      toast.error("Erro ao excluir perda");
    } finally {
      setIsDeleting(false);
      setLossToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) return <div className="p-4">Carregando perdas...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error}</div>;

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto p-1">
        <div className="max-h-[360px] min-w-full overflow-y-auto rounded-md border">
          <Table className="w-full table-fixed bg-white">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48 text-center">Produto</TableHead>
                <TableHead className="w-20 text-center">Qtd</TableHead>
                <TableHead className="w-40 text-center">Motivo</TableHead>
                <TableHead className="w-32 text-center">Data</TableHead>
                <TableHead
                  className="text-center"
                  style={{ width: "calc(100% - 180px)" }}
                >
                  Observações
                </TableHead>
                <TableHead className="w-20 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lostEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-18 text-center text-gray-500"
                  >
                    Nenhuma perda de produto encontrada
                  </TableCell>
                </TableRow>
              ) : (
                lostEntries.map((loss) => (
                  <TableRow key={loss.id}>
                    <TableCell className="w-48 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {loss.product?.imgUrl ? (
                          <img
                            src={loss.product.imgUrl}
                            alt={loss.product.name}
                            className="h-8 w-8 flex-shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <span className="truncate">
                          {loss.productName ||
                            loss.product?.name ||
                            "Produto não encontrado"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="w-20 text-center font-semibold">
                      {loss.quantity}
                    </TableCell>

                    <TableCell className="w-40 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getReasonLossIcon(loss.reasonLoss)}
                        <span className="truncate text-sm">
                          {reasonLossLabels[loss.reasonLoss]}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="w-32 text-center text-sm">
                      {new Date(loss.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell
                      className="text-center"
                      style={{ width: "calc(100% - 180px)" }}
                    >
                      <div className="w-full overflow-hidden pr-4">
                        {loss.note && loss.note.trim() !== "" ? (
                          <span className="break-words text-sm text-gray-700">
                            {loss.note}
                          </span>
                        ) : (
                          <span className="text-sm italic text-gray-400">
                            Sem observações
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="w-20 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(loss.id)}
                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog de confirmação de deleção */}
      <DeleteLossDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        lossId={lossToDelete || ""}
      />
    </div>
  );
};

export default LostEntriesTable;
