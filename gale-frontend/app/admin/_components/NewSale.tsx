"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { CirclePlus, Loader2, Minus, Plus, Search, Trash2, X } from "lucide-react";
import { formatCep, isCompleteCep, lookupCep } from "@/api/cep";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCatalog } from "@/_store/catalog/CatalogContext";
import { CatalogItem } from "@/api/catalog";
import { getSettings, SiteSettings } from "@/api/settings";
import { createOrder } from "@/api/order";
import { getClientsForTab, getAllClients, ClientForTab, getClientAddresses, MyAddress } from "@/api/user";
import { transactionTypes } from "@/_constants/transaction";
import { useWorkDay } from "@/_store/workDay/WorkDayContext";

// Formas de pagamento na hora de fechar a venda (Boleto fica de fora,
// não faz sentido pra uma venda de balcão).
const PAYMENT_METHODS = transactionTypes.filter((t) => t.value !== "BankSlip");

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

interface CartLine {
  item: CatalogItem;
  quantity: number;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const NewSale = () => {
  const { catalogItems, loadCatalogItems } = useCatalog();
  const { refresh: refreshWorkDay } = useWorkDay();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [transactionType, setTransactionType] = useState(
    PAYMENT_METHODS[0].value,
  );
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientForTab[]>([]);
  const [clientId, setClientId] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Entrega
  const [deliveryType, setDeliveryType] = useState<"InStore" | "Delivery">(
    "InStore",
  );
  const [isAnonymousDelivery, setIsAnonymousDelivery] = useState(true);
  const [deliveryClients, setDeliveryClients] = useState<ClientForTab[]>([]);
  const [deliveryClientId, setDeliveryClientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  // Endereços já cadastrados do cliente escolhido. "" no select significa
  // "outro endereço", que libera os campos em branco pra digitar.
  const [clientAddresses, setClientAddresses] = useState<MyAddress[]>([]);
  const [selectedClientAddressId, setSelectedClientAddressId] = useState("");
  const [addressTypeAddress, setAddressTypeAddress] = useState(
    TYPE_ADDRESS_OPTIONS[0].value,
  );
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressDistrict, setAddressDistrict] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressZipCode, setAddressZipCode] = useState("");
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "found" | "notFound"
  >("idle");

  // Busca o CEP assim que os 8 dígitos são digitados. Achando, preenche
  // rua/tipo/bairro; não achando, deixa tudo como está pra pessoa escrever.
  const handleZipCodeChange = async (value: string) => {
    const masked = formatCep(value);
    setAddressZipCode(masked);

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

    if (result.typeAddress) setAddressTypeAddress(result.typeAddress);
    if (result.address) setAddressStreet(result.address);
    if (result.district) setAddressDistrict(result.district);
    setCepStatus("found");
  };

  const isOnTheBill = transactionType === "OnTheBill";
  const isDelivery = deliveryType === "Delivery";

  // Copia um endereço salvo pros campos do formulário. Eles seguem
  // editáveis de propósito: dá pra ajustar o complemento de hoje sem
  // alterar o cadastro do cliente.
  const fillAddressFrom = (address: MyAddress) => {
    setAddressTypeAddress(address.typeAddress);
    setAddressStreet(address.address);
    setAddressNumber(address.number);
    setAddressDistrict(address.district);
    setAddressComplement(address.complement ?? "");
    setAddressZipCode(address.zipCode ?? "");
    setCepStatus("idle");
  };

  const clearAddressFields = () => {
    setAddressStreet("");
    setAddressNumber("");
    setAddressDistrict("");
    setAddressComplement("");
    setAddressZipCode("");
    setCepStatus("idle");
  };

  const handleSelectClientAddress = (addressId: string) => {
    setSelectedClientAddressId(addressId);
    const chosen = clientAddresses.find((address) => address.id === addressId);
    if (chosen) fillAddressFrom(chosen);
    else clearAddressFields();
  };

  useEffect(() => {
    if (!open) return;
    getSettings()
      .then((data) => {
        setSettings(data);
        if (!data.deliveryEnabled) setDeliveryType("InStore");
      })
      .catch(() => {
        // Sem configurações, os preços caem no valor normal.
      });
  }, [open]);

  // Busca clientes pra vincular na entrega (todos, não só quem pode fiado)
  // quando escolhe Delivery e desmarca "anônimo".
  useEffect(() => {
    if (!isDelivery || isAnonymousDelivery) return;
    if (deliveryClients.length > 0) {
      if (!deliveryClientId) setDeliveryClientId(deliveryClients[0].id);
      return;
    }
    getAllClients()
      .then((data) => {
        setDeliveryClients(data);
        if (data.length > 0) setDeliveryClientId(data[0].id);
      })
      .catch(() => toast.error("Erro ao carregar clientes."));
  }, [isDelivery, isAnonymousDelivery, deliveryClients, deliveryClientId]);

  // Carrega os endereços do cliente escolhido e já seleciona o principal:
  // na maioria das vezes é pra lá que a entrega vai, e o balcão não precisa
  // redigitar nada.
  useEffect(() => {
    if (!isDelivery || isAnonymousDelivery || !deliveryClientId) {
      setClientAddresses([]);
      setSelectedClientAddressId("");
      return;
    }

    getClientAddresses(deliveryClientId)
      .then((addresses) => {
        setClientAddresses(addresses);
        const preferred =
          addresses.find((address) => address.isPrimary) ?? addresses[0];
        if (preferred) {
          setSelectedClientAddressId(preferred.id);
          fillAddressFrom(preferred);
        } else {
          setSelectedClientAddressId("");
        }
      })
      .catch(() => {
        // Sem endereços carregados sobra o preenchimento manual, que
        // continua funcionando.
        setClientAddresses([]);
      });
  }, [isDelivery, isAnonymousDelivery, deliveryClientId]);

  // Busca a lista de clientes quando escolhe Notinha (só na primeira vez;
  // depois fica em cache). Garante também que sempre exista um cliente
  // selecionado por padrão — sem isso, depois da 1ª notinha o campo ficava
  // "vazio por dentro" mesmo mostrando um nome no <select>, e a venda
  // seguinte não conseguia ser registrada.
  useEffect(() => {
    if (!isOnTheBill) return;

    if (clients.length === 0) {
      getClientsForTab()
        .then((data) => {
          setClients(data);
          if (data.length > 0) setClientId(data[0].id);
        })
        .catch(() => toast.error("Erro ao carregar clientes."));
      return;
    }

    if (!clientId) {
      setClientId(clients[0].id);
    }
  }, [isOnTheBill, clients, clientId]);

  // Mesma prioridade de preço usada no backend (order.service -> pricing.utils):
  // iFood (não se aplica aqui) > liquidação > atacado > noturno > normal.
  const isCurrentlyNight = (): boolean => {
    if (!settings || !settings.nightPriceEnabled) return false;
    const hour = new Date().getHours();
    const { nightPriceStartHour: start, nightPriceEndHour: end } = settings;
    if (start === end) return false;
    if (start > end) return hour >= start || hour < end;
    return hour >= start && hour < end;
  };

  const getUnitPrice = (item: CatalogItem, quantity: number): number => {
    if (item.isLiquidation && item.liquidationPrice) {
      return item.liquidationPrice;
    }

    const hasPackageDiscount =
      item.wholesaleEnabled &&
      item.packageDiscountAmount != null &&
      item.packageDiscountAmount > 0 &&
      item.discountPackPrice != null &&
      item.discountPackPrice > 0 &&
      quantity >= item.packageDiscountAmount;

    if (hasPackageDiscount) {
      return item.discountPackPrice!;
    }

    if (isCurrentlyNight() && item.consumerNightPrice) {
      return item.consumerNightPrice;
    }

    return item.consumerPrice ?? 0;
  };

  const availableItems = catalogItems.filter(
    (item) => item.available && (item.totalStock ?? 0) > 0,
  );

  // Sem termo de busca, mostra a lista inteira de produtos disponíveis
  // (pra poder navegar/clicar sem precisar digitar nada); com termo,
  // filtra por nome ou código de barras.
  const visibleItems = useMemo(() => {
    const sorted = [...availableItems].sort((a, b) =>
      a.product.name.localeCompare(b.product.name),
    );
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter(
      (item) =>
        item.product.name.toLowerCase().includes(term) ||
        item.product.barCode?.toLowerCase() === term,
    );
  }, [searchTerm, availableItems]);

  const cartQuantity = (catalogId: string): number =>
    cart.find((line) => line.item.id === catalogId)?.quantity ?? 0;

  const addToCart = (item: CatalogItem) => {
    const currentQty = cartQuantity(item.id);
    const maxStock = item.totalStock ?? 0;

    if (currentQty >= maxStock) {
      toast.error(`Sem mais estoque de "${item.product.name}".`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.item.id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });

    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    // Leitor de código de barras: bate exato com um único produto.
    const exactMatch = availableItems.find(
      (item) =>
        item.product.barCode?.toLowerCase() === searchTerm.trim().toLowerCase(),
    );
    if (exactMatch) {
      addToCart(exactMatch);
      return;
    }

    if (searchTerm.trim() && visibleItems.length === 1) {
      addToCart(visibleItems[0]);
    }
  };

  const updateQuantity = (catalogId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((line) => {
          if (line.item.id !== catalogId) return line;
          const maxStock = line.item.totalStock ?? 0;
          const newQuantity = line.quantity + delta;

          if (newQuantity > maxStock) {
            toast.error(`Sem mais estoque de "${line.item.product.name}".`);
            return line;
          }
          return { ...line, quantity: newQuantity };
        })
        .filter((line) => line.quantity > 0);
    });
  };

  const removeFromCart = (catalogId: string) => {
    setCart((prev) => prev.filter((line) => line.item.id !== catalogId));
  };

  const total = cart.reduce(
    (sum, line) => sum + getUnitPrice(line.item, line.quantity) * line.quantity,
    0,
  );

  const resetSale = () => {
    setCart([]);
    setSearchTerm("");
    setTransactionType(PAYMENT_METHODS[0].value);
    setClientId("");
    setDeliveryType("InStore");
    setIsAnonymousDelivery(true);
    setDeliveryClientId("");
    setClientAddresses([]);
    setSelectedClientAddressId("");
    setRecipientName("");
    setAddressTypeAddress(TYPE_ADDRESS_OPTIONS[0].value);
    setAddressStreet("");
    setAddressNumber("");
    setAddressDistrict("");
    setAddressComplement("");
    setAddressZipCode("");
    setCepStatus("idle");
  };

  const handleCloseSale = () => {
    setOpen(false);
    resetSale();
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Adicione ao menos um produto à venda.");
      return;
    }

    if (isOnTheBill && !clientId) {
      toast.error("Escolha o cliente que vai ficar na notinha.");
      return;
    }

    // A notinha já identifica uma pessoa real; pra entrega sem notinha,
    // precisa escolher um cliente cadastrado ou marcar como anônima.
    if (isDelivery) {
      if (!addressStreet.trim() || !addressNumber.trim() || !addressDistrict.trim()) {
        toast.error("Preencha o endereço de entrega.");
        return;
      }
      if (!isOnTheBill) {
        if (!isAnonymousDelivery && !deliveryClientId) {
          toast.error("Escolha o cliente da entrega ou marque como anônima.");
          return;
        }
        if (isAnonymousDelivery && !recipientName.trim()) {
          toast.error("Informe o nome de quem vai receber a entrega.");
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const finalClientId = isOnTheBill
        ? clientId
        : isDelivery && !isAnonymousDelivery
          ? deliveryClientId
          : undefined;

      await createOrder({
        order: {
          deliveryType,
          ...(isDelivery && { orderSource: "Call" }),
          ...(finalClientId && { clientId: finalClientId }),
        },
        orderDetails: cart.map((line) => ({
          productId: line.item.id,
          quantity: line.quantity,
        })),
        orderTransaction: { transactionType },
        ...(isDelivery && {
          orderAddress: {
            ...(!isOnTheBill &&
              isAnonymousDelivery && { recipientName: recipientName.trim() }),
            typeAddress: addressTypeAddress,
            address: addressStreet.trim(),
            number: addressNumber.trim(),
            district: addressDistrict.trim(),
            complement: addressComplement.trim() || undefined,
            zipCode: addressZipCode.trim() || undefined,
          },
        }),
      });

      toast.success(
        isOnTheBill
          ? "Notinha registrada! A conta fica em aberto até ser fechada."
          : isDelivery
            ? "Entrega registrada com sucesso!"
            : "Venda registrada com sucesso!",
      );
      handleCloseSale();
      loadCatalogItems();
      refreshWorkDay?.();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao registrar a venda. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="hover:bg-green-500 hover:text-white"
      >
        <CirclePlus />
        Nova venda
      </Button>

      <Drawer open={open} onOpenChange={(v) => (v ? setOpen(true) : handleCloseSale())} direction="right">
        <DrawerContent className="fixed right-0 top-0 flex h-screen w-full max-w-[420px] flex-col rounded-md border-l bg-white shadow-lg">
          <DrawerHeader className="py-2">
            <DrawerTitle>Nova Venda</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" className="absolute right-2 top-2">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {/* Tipo de venda */}
            <div className="flex-shrink-0 space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Onde está acontecendo a venda?
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={deliveryType === "InStore" ? "default" : "outline"}
                  className={`h-8 flex-1 text-xs ${
                    deliveryType === "InStore"
                      ? "bg-black text-white hover:bg-black/90"
                      : ""
                  }`}
                  onClick={() => setDeliveryType("InStore")}
                >
                  Na loja
                </Button>
                {(!settings || settings.deliveryEnabled) && (
                  <Button
                    type="button"
                    variant={
                      deliveryType === "Delivery" ? "default" : "outline"
                    }
                    className={`h-8 flex-1 text-xs ${
                      deliveryType === "Delivery"
                        ? "bg-black text-white hover:bg-black/90"
                        : ""
                    }`}
                    onClick={() => setDeliveryType("Delivery")}
                  >
                    Delivery
                  </Button>
                )}
              </div>
            </div>

            {isDelivery && (
              <div className="flex-shrink-0 space-y-2 rounded-md border bg-gray-50 p-2">
                {!isOnTheBill && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={isAnonymousDelivery}
                        onChange={(e) =>
                          setIsAnonymousDelivery(e.target.checked)
                        }
                        className="h-3.5 w-3.5"
                      />
                      Entrega anônima (sem cliente cadastrado)
                    </label>

                    {isAnonymousDelivery ? (
                      <Input
                        placeholder="Nome de quem vai receber"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="h-8 text-xs"
                      />
                    ) : deliveryClients.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        Nenhum cliente cadastrado.
                      </p>
                    ) : (
                      <>
                        <select
                          value={deliveryClientId}
                          onChange={(e) => setDeliveryClientId(e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-white px-2 text-xs"
                        >
                          {deliveryClients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.fullName}
                            </option>
                          ))}
                        </select>

                        {/* Endereços já cadastrados do cliente. Escolher um
                            preenche os campos abaixo, que seguem editáveis
                            pra ajustes pontuais. */}
                        {clientAddresses.length > 0 ? (
                          <select
                            value={selectedClientAddressId}
                            onChange={(e) =>
                              handleSelectClientAddress(e.target.value)
                            }
                            className="h-8 w-full rounded-md border border-input bg-white px-2 text-xs"
                          >
                            {clientAddresses.map((address) => (
                              <option key={address.id} value={address.id}>
                                {address.isPrimary ? "★ " : ""}
                                {TYPE_ADDRESS_OPTIONS.find(
                                  (opt) => opt.value === address.typeAddress,
                                )?.label ?? address.typeAddress}{" "}
                                {address.address}, {address.number} —{" "}
                                {address.district}
                              </option>
                            ))}
                            <option value="">Outro endereço (digitar)</option>
                          </select>
                        ) : (
                          <p className="text-[10px] text-gray-400">
                            Esse cliente não tem endereço salvo — preencha
                            abaixo.
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* CEP primeiro: achando, já preenche rua e bairro */}
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="CEP (opcional)"
                    value={addressZipCode}
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
                    value={addressTypeAddress}
                    onChange={(e) => setAddressTypeAddress(e.target.value)}
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
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    className="col-span-2 h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    placeholder="Número"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Bairro"
                    value={addressDistrict}
                    onChange={(e) => setAddressDistrict(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Input
                  placeholder="Complemento (opcional)"
                  value={addressComplement}
                  onChange={(e) => setAddressComplement(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Busca de produto */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nome ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>

            {/* Lista de produtos disponíveis (filtra ao digitar na busca) */}
            <div className="max-h-40 flex-shrink-0 overflow-y-auto rounded-md border">
              {visibleItems.length === 0 ? (
                <p className="p-3 text-center text-xs text-gray-400">
                  Nenhum produto disponível encontrado.
                </p>
              ) : (
                visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
                  >
                    <span className="truncate">{item.product.name}</span>
                    <span className="flex-shrink-0 text-xs text-gray-500">
                      {item.totalStock} un.
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Carrinho */}
            <div className="flex-1 space-y-2">
              {cart.length > 0 && (
                <label className="text-xs font-medium text-gray-600">
                  Carrinho
                </label>
              )}
              {cart.length === 0 ? (
                <p className="pt-2 text-center text-sm text-gray-400">
                  Clique num produto acima pra começar a venda.
                </p>
              ) : (
                cart.map((line) => {
                  const unitPrice = getUnitPrice(line.item, line.quantity);
                  return (
                    <div
                      key={line.item.id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {line.item.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(unitPrice)} / un.
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(line.item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(line.item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="w-16 flex-shrink-0 text-right text-sm font-semibold">
                        {formatCurrency(unitPrice * line.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(line.item.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Forma de pagamento */}
            {cart.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Forma de pagamento
                </label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>

                {isOnTheBill && (
                  <>
                    <label className="text-xs font-medium text-gray-600">
                      Cliente da notinha
                    </label>
                    {clients.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        Nenhum cliente autorizado a pegar fiado.
                      </p>
                    ) : (
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      >
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.fullName}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-[10px] text-gray-400">
                      A conta fica em aberto até ser fechada (na tela Resumo).
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Total e botões */}
          <div className="flex-shrink-0 space-y-3 border-t p-4">
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {isDelivery && settings && (
              <p className="-mt-2 text-right text-xs text-gray-400">
                + Frete: {formatCurrency(settings.freightPrice)}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseSale}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 bg-black text-white hover:bg-green-600"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  cart.length === 0 ||
                  (isOnTheBill && !clientId) ||
                  (isDelivery &&
                    (!addressStreet.trim() ||
                      !addressNumber.trim() ||
                      !addressDistrict.trim() ||
                      (!isOnTheBill &&
                        (isAnonymousDelivery
                          ? !recipientName.trim()
                          : !deliveryClientId))))
                }
              >
                {submitting
                  ? "Registrando..."
                  : isOnTheBill
                    ? "Registrar notinha"
                    : isDelivery
                      ? "Registrar entrega"
                      : "Fechar venda"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NewSale;
