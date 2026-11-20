"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import SideBar from "@/admin/_components/SideBar";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import {
  Loader2,
  Pencil,
  Search,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  getAllSells,
  updateSale,
  Sale,
  UpdateSalePayload,
} from "@/api/order";
import { formatCep, isCompleteCep, lookupCep } from "@/api/cep";
import { getAllClients, ClientForTab } from "@/api/user";
import { transactionTypes } from "@/_constants/transaction";

const PAYMENT_METHODS = transactionTypes.filter((t) => t.value !== "BankSlip");

const PAYMENT_LABELS: Record<string, string> = Object.fromEntries(
  transactionTypes.map((t) => [t.value, t.label]),
);

const TYPE_ADDRESS_OPTIONS = [
  { value: "Street", label: "Rua" },
  { value: "Avanue", label: "Avenida" },
  { value: "Alley", label: "Beco" },
  { value: "Lane", label: "Travessa" },
  { value: "Highway", label: "Rodovia" },
  { value: "Road", label: "Estrada" },
  { value: "Square", label: "Praça" },
  { value: "Village", label: "Vila" },
  { value: "Condominium", label: "Condomínio" },
];

type DeliveryFilter = "All" | "InStore" | "Delivery";

interface EditItem {
  orderDetailId: string;
  productName: string;
  unityPrice: number;
  quantity: number;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

// Uma casa decimal basta: taxa de maquininha e margem são lidas de relance.
const formatPercent = (value: number): string =>
  `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const SellsPage = () => {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("All");
  const [allClients, setAllClients] = useState<ClientForTab[]>([]);

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editTransactionType, setEditTransactionType] = useState("Money");
  const [editBuyerMode, setEditBuyerMode] = useState<"client" | "anonymous">(
    "anonymous",
  );
  const [editClientId, setEditClientId] = useState("");
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editAddressType, setEditAddressType] = useState(
    TYPE_ADDRESS_OPTIONS[0].value,
  );
  const [editAddress, setEditAddress] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editComplement, setEditComplement] = useState("");
  const [editZipCode, setEditZipCode] = useState("");
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "found" | "notFound"
  >("idle");

  // Busca o CEP assim que os 8 dígitos são digitados. Achando, preenche
  // rua/tipo/bairro; não achando, deixa tudo como está pra pessoa escrever.
  const handleZipCodeChange = async (value: string) => {
    const masked = formatCep(value);
    setEditZipCode(masked);

    if (!isCompleteCep(masked)) {
      setCepStatus("idle");
      return;
    }

    setCepStatus("loading");
    const result = await lookupCep(masked);

    if (!result) {
      setCepStatus("notFound");
      return;
    }

    if (result.typeAddress) setEditAddressType(result.typeAddress);
    if (result.address) setEditAddress(result.address);
    if (result.district) setEditDistrict(result.district);
    setCepStatus("found");
  };
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [saving, setSaving] = useState(false);

  const canAccess = !user || user.role === "Admin" || user.role === "Shopper";

  const loadSales = () => {
    setLoading(true);
    getAllSells()
      .then(setSales)
      .catch(() => toast.error("Erro ao carregar as vendas."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccess) return;
    loadSales();
    getAllClients()
      .then(setAllClients)
      .catch(() => toast.error("Erro ao carregar clientes."));
  }, [canAccess]);

  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sales.filter((sale) => {
      if (deliveryFilter !== "All" && sale.deliveryType !== deliveryFilter) {
        return false;
      }
      if (!term) return true;
      const productsMatch = sale.products.some((p) =>
        p.productName.toLowerCase().includes(term),
      );
      return sale.buyer.name.toLowerCase().includes(term) || productsMatch;
    });
  }, [sales, searchTerm, deliveryFilter]);

  const handleStartEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditTransactionType(sale.transactionType ?? "Money");
    setEditBuyerMode(sale.buyer.clientId ? "client" : "anonymous");
    setEditClientId(sale.buyer.clientId ?? "");
    setEditRecipientName(sale.address?.recipientName ?? "");
    setEditAddressType(sale.address?.typeAddress ?? TYPE_ADDRESS_OPTIONS[0].value);
    setEditAddress(sale.address?.address ?? "");
    setEditNumber(sale.address?.number ?? "");
    setEditDistrict(sale.address?.district ?? "");
    setEditComplement(sale.address?.complement ?? "");
    setEditZipCode(sale.address?.zipCode ?? "");
    setCepStatus("idle");
    setEditItems(
      sale.products.map((p) => ({
        orderDetailId: p.id,
        productName: p.productName,
        unityPrice: p.unityPrice,
        quantity: p.quantity,
      })),
    );
  };

  const updateItemQuantity = (orderDetailId: string, delta: number) => {
    setEditItems((prev) =>
      prev.map((item) =>
        item.orderDetailId === orderDetailId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      ),
    );
  };

  const removeItem = (orderDetailId: string) => {
    setEditItems((prev) =>
      prev.map((item) =>
        item.orderDetailId === orderDetailId ? { ...item, quantity: 0 } : item,
      ),
    );
  };

  const isEditingDelivery = editingSale?.deliveryType === "Delivery";
  const editTotal = editItems.reduce(
    (sum, item) => sum + item.unityPrice * item.quantity,
    0,
  );

  const handleSaveEdit = async () => {
    if (!editingSale) return;

    if (editItems.every((item) => item.quantity === 0)) {
      toast.error("A venda precisa ter pelo menos um produto.");
      return;
    }
    if (editBuyerMode === "client" && !editClientId) {
      toast.error("Escolha o cliente ou marque como anônima.");
      return;
    }
    if (isEditingDelivery) {
      if (!editAddress.trim() || !editNumber.trim() || !editDistrict.trim()) {
        toast.error("Preencha o endereço de entrega.");
        return;
      }
      if (editBuyerMode === "anonymous" && !editRecipientName.trim()) {
        toast.error("Informe o nome de quem recebeu a entrega.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: UpdateSalePayload = {
        transactionType: editTransactionType,
        clientId: editBuyerMode === "client" ? editClientId : null,
        items: editItems.map((item) => ({
          orderDetailId: item.orderDetailId,
          quantity: item.quantity,
        })),
      };

      if (isEditingDelivery) {
        payload.recipientName =
          editBuyerMode === "anonymous" ? editRecipientName.trim() : undefined;
        payload.typeAddress = editAddressType;
        payload.address = editAddress.trim();
        payload.number = editNumber.trim();
        payload.district = editDistrict.trim();
        payload.complement = editComplement.trim() || undefined;
        payload.zipCode = editZipCode.trim() || undefined;
      }

      await updateSale(editingSale.id, payload);
      toast.success("Venda atualizada com sucesso!");
      setEditingSale(null);
      loadSales();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao atualizar a venda. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
        <SideBar />
        <div className="flex flex-1 items-center justify-center rounded-md border border-black bg-white">
          <p className="text-gray-500">
            Você não tem permissão para acessar essa página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white">
        <header className="flex-shrink-0 border-b px-6 py-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <ShoppingBag className="h-6 w-6" />
            Vendas
          </h1>
          <p className="text-gray-600">{sales.length} venda(s) registrada(s)</p>
        </header>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b p-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por comprador ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { value: "All", label: "Todos" },
                { value: "InStore", label: "Na loja" },
                { value: "Delivery", label: "Delivery" },
              ] as { value: DeliveryFilter; label: string }[]
            ).map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={deliveryFilter === opt.value ? "default" : "outline"}
                className={
                  deliveryFilter === opt.value
                    ? "bg-black text-white hover:bg-black/90"
                    : ""
                }
                onClick={() => setDeliveryFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Fat. líquido</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-700">
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">
                          {sale.buyer.name}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            sale.buyer.isAnonymous
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {sale.buyer.isAnonymous ? "Anônimo" : "Cliente"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            sale.deliveryType === "Delivery"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {sale.deliveryType === "Delivery"
                            ? "Delivery"
                            : "Na loja"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-800">
                          {sale.transactionType
                            ? PAYMENT_LABELS[sale.transactionType] ??
                              sale.transactionType
                            : "—"}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            sale.isPaid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sale.isPaid ? "Pago" : "Em aberto"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p
                          className="truncate text-xs text-gray-600"
                          title={sale.products
                            .map((p) => `${p.quantity}x ${p.productName}`)
                            .join(", ")}
                        >
                          {sale.products
                            .map((p) => `${p.quantity}x ${p.productName}`)
                            .join(", ")}
                        </p>
                      </TableCell>
                      {/* Bruto cobrado do cliente */}
                      <TableCell className="whitespace-nowrap text-right font-semibold text-gray-900">
                        {formatCurrency(sale.totalPrice)}
                      </TableCell>

                      {/* O que sobra depois da taxa da maquininha */}
                      <TableCell className="whitespace-nowrap text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(sale.netPrice)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {sale.feeAmount > 0
                            ? `− ${formatCurrency(sale.feeAmount)} (${formatPercent(sale.feePercent)})`
                            : "sem taxa"}
                        </p>
                      </TableCell>

                      {/* Líquido menos o custo das mercadorias */}
                      <TableCell className="whitespace-nowrap text-right">
                        <p
                          className={`font-semibold ${
                            sale.profit < 0 ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {formatCurrency(sale.profit)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {sale.netPrice > 0
                            ? `${formatPercent((sale.profit / sale.netPrice) * 100)} de margem`
                            : "—"}
                        </p>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(sale)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSales.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400">
                  Nenhuma venda encontrada.
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Editar venda */}
      <Dialog
        open={!!editingSale}
        onOpenChange={(v) => !v && setEditingSale(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar venda</DialogTitle>
          </DialogHeader>
          {editingSale && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Forma de pagamento
                </label>
                <select
                  value={editTransactionType}
                  onChange={(e) => setEditTransactionType(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Comprador
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={editBuyerMode === "client" ? "default" : "outline"}
                    className={`flex-1 text-xs ${
                      editBuyerMode === "client"
                        ? "bg-black text-white hover:bg-black/90"
                        : ""
                    }`}
                    onClick={() => setEditBuyerMode("client")}
                  >
                    Cliente identificado
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      editBuyerMode === "anonymous" ? "default" : "outline"
                    }
                    className={`flex-1 text-xs ${
                      editBuyerMode === "anonymous"
                        ? "bg-black text-white hover:bg-black/90"
                        : ""
                    }`}
                    onClick={() => setEditBuyerMode("anonymous")}
                  >
                    Anônimo
                  </Button>
                </div>
                {editBuyerMode === "client" ? (
                  allClients.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Nenhum cliente cadastrado.
                    </p>
                  ) : (
                    <select
                      value={editClientId}
                      onChange={(e) => setEditClientId(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Selecione um cliente</option>
                      {allClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName}
                        </option>
                      ))}
                    </select>
                  )
                ) : isEditingDelivery ? (
                  <Input
                    placeholder="Nome de quem recebeu"
                    value={editRecipientName}
                    onChange={(e) => setEditRecipientName(e.target.value)}
                  />
                ) : null}
              </div>

              {isEditingDelivery && (
                <div className="space-y-2 rounded-md border bg-gray-50 p-2">
                  <label className="text-xs font-medium text-gray-600">
                    Endereço de entrega
                  </label>
                  {/* CEP primeiro: achando, já preenche rua e bairro */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="CEP (opcional)"
                      value={editZipCode}
                      onChange={(e) => handleZipCodeChange(e.target.value)}
                      inputMode="numeric"
                      className="h-8 w-28 text-xs"
                    />
                    {cepStatus === "loading" && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando...
                      </span>
                    )}
                    {cepStatus === "found" && (
                      <span className="text-[10px] text-green-600">
                        Endereço preenchido
                      </span>
                    )}
                    {cepStatus === "notFound" && (
                      <span className="text-[10px] text-gray-400">
                        CEP não encontrado — preencha abaixo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <select
                      value={editAddressType}
                      onChange={(e) => setEditAddressType(e.target.value)}
                      className="h-8 rounded-md border border-input bg-white px-1 text-xs"
                    >
                      {TYPE_ADDRESS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Endereço"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="col-span-2 h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      placeholder="Número"
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Bairro"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Input
                    placeholder="Complemento (opcional)"
                    value={editComplement}
                    onChange={(e) => setEditComplement(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Produtos
                </label>
                <div className="space-y-2">
                  {editItems.map((item) => (
                    <div
                      key={item.orderDetailId}
                      className={`flex items-center gap-2 rounded-md border p-2 ${
                        item.quantity === 0 ? "opacity-40" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.unityPrice)} / un.
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() =>
                            updateItemQuantity(item.orderDetailId, -1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() =>
                            updateItemQuantity(item.orderDetailId, 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="w-16 flex-shrink-0 text-right text-sm font-semibold">
                        {formatCurrency(item.unityPrice * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.orderDetailId)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">
                  Diminuir até 0 remove o produto da venda (o estoque é
                  devolvido).
                </p>
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
                <span>Total dos produtos</span>
                <span>{formatCurrency(editTotal)}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingSale(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-black text-white hover:bg-green-600"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellsPage;
