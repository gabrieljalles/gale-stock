"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Button } from "@/_components/ui/button";
import {
  Loader2,
  RefreshCw,
  Truck,
  MapPin,
  Smartphone,
  MessageCircle,
  Instagram,
  UtensilsCrossed,
  Phone,
  ClipboardList,
  ArrowLeft,
  X,
  MapPinned,
  Map as MapIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  getKanbanOrders,
  startPreparing,
  toggleChecklistItem,
  assignDriver,
  markDelivered,
  cancelOrder,
  revertOrderStatus,
  geocodePendingOrders,
  getMapCenter,
  KanbanOrder,
  KanbanOrderStatus,
} from "@/api/order";
import { getDeliveryMen, DeliveryMan } from "@/api/user";
import { getSettings, SiteSettings } from "@/api/settings";
import { STATUS_COLORS, STATUS_LABELS } from "./DeliveryMap";

// Leaflet só roda no navegador (usa window), então o mapa entra por import
// dinâmico sem SSR.
const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando mapa...
    </div>
  ),
});

// Etapa anterior de cada coluna, pra saber quando mostrar a setinha de
// voltar (a primeira coluna não tem pra onde voltar).
const PREVIOUS_STATUS: Partial<Record<KanbanOrderStatus, boolean>> = {
  Preparing: true,
  ReadyToPickup: true,
  OutForDelivery: true,
  Delivered: true,
};

const SOURCE_ICONS: Record<string, any> = {
  App: Smartphone,
  WhatsApp: MessageCircle,
  Instagram: Instagram,
  Ifood: UtensilsCrossed,
  Call: Phone,
};

const SOURCE_LABELS: Record<string, string> = {
  App: "App",
  WhatsApp: "WhatsApp",
  Instagram: "Instagram",
  Ifood: "iFood",
  Call: "Nova Venda (balcão)",
  Local: "Loja",
};

interface ColumnConfig {
  status: KanbanOrderStatus;
  title: string;
  header: string;
}

// Itens de uma coluna: normalmente só pedidos, mas a coluna "A caminho"
// intercala cabeçalhos de motoboy pra agrupar as entregas de cada um.
type ColumnItem =
  | {
      type: "header";
      driverId: string;
      driverName: string;
      count: number;
      routeUrl: string | null;
    }
  | { type: "order"; order: KanbanOrder };

// Cores bem contrastantes entre si — cada etapa vai virar uma cor de pin
// no mapa mais pra frente, então precisam ser fáceis de diferenciar.
const COLUMNS: ColumnConfig[] = [
  { status: "Confirmed", title: "Recebido", header: "bg-red-600" },
  { status: "Preparing", title: "Em preparação", header: "bg-amber-600" },
  { status: "ReadyToPickup", title: "Pronto", header: "bg-violet-600" },
  { status: "OutForDelivery", title: "A caminho", header: "bg-cyan-600" },
  { status: "Delivered", title: "Entregue", header: "bg-green-600" },
];

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

// Endereço completo pro Google Maps. Os pedidos guardam só rua/número/
// bairro, então a cidade/UF vem das Configurações.
const fullAddress = (
  order: KanbanOrder,
  city: string,
  state: string,
): string | null => {
  if (!order.address) return null;
  const { address, number, district } = order.address;
  return `${address}, ${number} - ${district}, ${city} - ${state}`;
};

const hasCoordinates = (order: KanbanOrder): boolean =>
  order.address?.latitude != null && order.address?.longitude != null;

// Distância aproximada em km entre dois pedidos (fórmula de Haversine).
const distanceKm = (a: KanbanOrder, b: KanbanOrder): number => {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = a.address!.latitude!;
  const lon1 = a.address!.longitude!;
  const lat2 = b.address!.latitude!;
  const lon2 = b.address!.longitude!;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// Ordena as paradas pelo vizinho mais próximo: começa na primeira entrega e
// vai sempre pra mais perto que ainda falta. Não é a rota ótima (isso é o
// problema do caixeiro viajante), mas encurta bastante o trajeto em relação
// à ordem de chegada dos pedidos. Endereços sem coordenada vão pro fim,
// já que não dá pra posicioná-los.
const sortByProximity = (orders: KanbanOrder[]): KanbanOrder[] => {
  const located = orders.filter(hasCoordinates);
  const unlocated = orders.filter((order) => !hasCoordinates(order));

  if (located.length <= 2) return [...located, ...unlocated];

  const remaining = [...located];
  const route: KanbanOrder[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((candidate, index) => {
      const distance = distanceKm(current, candidate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    route.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return [...route, ...unlocated];
};

// Monta a rota no Google Maps com todas as paradas do motoboy. A origem
// fica em branco de propósito: o Google usa a localização atual de quem
// abrir o link (o próprio entregador, no celular dele).
const buildRouteUrl = (stops: string[]): string => {
  const destination = encodeURIComponent(stops[stops.length - 1]);
  const waypoints = stops
    .slice(0, -1)
    .map((stop) => encodeURIComponent(stop))
    .join("|");

  return (
    `https://www.google.com/maps/dir/?api=1&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : "") +
    "&travelmode=driving"
  );
};

interface OrdersKanbanBoardProps {
  // Versão reduzida (texto menor, cards mais enxutos) pra caber embutida
  // em outras telas, como o Resumo.
  compact?: boolean;
  /** Coluna "Entregue" só com as entregas do dia de trabalho aberto. */
  todayOnly?: boolean;
  // Classe de altura do quadro. Em tela cheia ele preenche o espaço
  // disponível; embutido, usa uma altura fixa com scroll próprio.
  heightClassName?: string;
  // Quais colunas mostrar (default: todas). Permite renderizar o "Entregue"
  // separado do resto, por exemplo.
  columns?: KanbanOrderStatus[];
}

const OrdersKanbanBoard = ({
  compact = false,
  todayOnly = false,
  heightClassName,
  columns,
}: OrdersKanbanBoardProps) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>(
    {},
  );
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(
    null,
  );

  const canAccess = !user || user.role === "Admin" || user.role === "Shopper";

  // Tokens de tamanho — só o essencial encolhe no modo compacto, sem
  // perder legibilidade dos textos que importam (nome, produtos, ações).
  const s = compact
    ? {
        columnHeader: "px-2 py-1.5 text-xs",
        countBadge: "px-1.5 py-0.5 text-[10px]",
        cardPadding: "p-2",
        cardGap: "space-y-1.5",
        buyerName: "text-xs",
        address: "text-[10px]",
        productList: "text-[10px]",
        checklistBox: "p-1",
        checklistText: "text-[11px]",
        footerNote: "text-[9px]",
        buttonHeight: "h-7 text-[11px]",
        badge: "px-1.5 py-0.5 text-[9px]",
        sourceIcon: "h-4 w-4",
        sourceIconInner: "h-2.5 w-2.5",
        columnGap: "gap-1.5",
      }
    : {
        columnHeader: "px-3 py-2 text-sm",
        countBadge: "px-2 py-0.5 text-xs",
        cardPadding: "p-2.5",
        cardGap: "space-y-2",
        buyerName: "text-sm",
        address: "text-[11px]",
        productList: "text-[11px]",
        checklistBox: "p-1.5",
        checklistText: "text-xs",
        footerNote: "text-[10px]",
        buttonHeight: "h-8 text-sm",
        badge: "px-2 py-0.5 text-[10px]",
        sourceIcon: "h-5 w-5",
        sourceIconInner: "h-3 w-3",
        columnGap: "gap-2",
      };

  const loadOrders = (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    getKanbanOrders(todayOnly)
      .then(setOrders)
      .catch(() => toast.error("Erro ao carregar os pedidos."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    if (!canAccess) return;
    loadOrders();
    getDeliveryMen()
      .then(setDeliveryMen)
      .catch(() => toast.error("Erro ao carregar motoboys."));
    getSettings()
      .then(setSettings)
      .catch(() => {
        // Sem configurações, o Kanban funciona normalmente sem pré-seleção.
      });

    // Kanban colaborativo — mais de uma pessoa pode estar mexendo nos
    // pedidos ao mesmo tempo (balcão + separação + entrega).
    const interval = setInterval(() => loadOrders(), 20000);
    return () => clearInterval(interval);
  }, [canAccess]);

  const grouped = useMemo(() => {
    const map: Record<KanbanOrderStatus, KanbanOrder[]> = {
      Confirmed: [],
      Preparing: [],
      ReadyToPickup: [],
      OutForDelivery: [],
      Delivered: [],
    };
    orders.forEach((order) => map[order.orderStatus]?.push(order));

    (Object.keys(map) as KanbanOrderStatus[]).forEach((status) => {
      map[status].sort((a, b) =>
        status === "Delivered"
          ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    return map;
  }, [orders]);

  // Exército de um homem só: pré-seleciona o próprio Admin logado (ou o
  // primeiro Admin da lista, se quem está usando for um Vendedor) como
  // motoboy padrão no seletor da coluna "Pronto".
  const defaultDriverId = useMemo(() => {
    if (!settings?.oneManArmyMode) return "";
    if (user?.role === "Admin") return user.id;
    return deliveryMen.find((man) => man.accountType === "Admin")?.id ?? "";
  }, [settings, user, deliveryMen]);

  const runAction = async (
    orderId: string,
    action: () => Promise<unknown>,
    successMessage?: string,
  ) => {
    setBusyOrderId(orderId);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      loadOrders();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao atualizar o pedido. Tente novamente.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const [cancelTarget, setCancelTarget] = useState<KanbanOrder | null>(
    null,
  );

  const handleStartPreparing = (orderId: string) =>
    runAction(orderId, () => startPreparing(orderId));

  const handleToggleItem = (
    orderId: string,
    orderDetailId: string,
    checked: boolean,
  ) =>
    runAction(orderId, () => toggleChecklistItem(orderId, orderDetailId, checked));

  const handleAssignDriver = (orderId: string) => {
    const deliveryManId = selectedDriver[orderId] || defaultDriverId;
    if (!deliveryManId) {
      toast.error("Escolha um motoboy pra atribuir.");
      return;
    }
    runAction(
      orderId,
      () => assignDriver(orderId, deliveryManId),
      "Motoboy atribuído! Pedido a caminho.",
    );
  };

  const handleMarkDelivered = (orderId: string) =>
    runAction(orderId, () => markDelivered(orderId), "Pedido marcado como entregue!");

  const handleRevert = (orderId: string) =>
    runAction(orderId, () => revertOrderStatus(orderId), "Pedido voltou pra etapa anterior.");

  // Cancelar devolve mercadoria ao estoque, então passa por confirmação:
  // é o único botão do Kanban que mexe em inventário.
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    await runAction(
      target.id,
      () => cancelOrder(target.id),
      "Pedido cancelado e produtos devolvidos ao estoque.",
    );
  };

  // Pedidos que aparecem no mapa: os ativos (entregue já saiu de cena).
  const mapOrders = useMemo(
    () => orders.filter((order) => order.orderStatus !== "Delivered"),
    [orders],
  );

  const locatedCount = mapOrders.filter(hasCoordinates).length;
  // Pedidos ativos cujo endereço o mapa não conseguiu localizar. Ficam
  // listados no modal pra dar pra corrigir o endereço na aba Vendas.
  const unlocatedOrders = mapOrders.filter((order) => !hasCoordinates(order));

  // Ao abrir o mapa: descobre o centro (cidade das Configurações) e resolve
  // as coordenadas dos endereços que ainda não passaram pelo geocoding.
  const runGeocoding = async (retryFailed = false) => {
    setGeocoding(true);
    try {
      if (!mapCenter) {
        const center = await getMapCenter();
        if (center.latitude != null && center.longitude != null) {
          setMapCenter([center.latitude, center.longitude]);
        }
      }

      const result = await geocodePendingOrders(retryFailed);
      if (result.pending > 0) loadOrders();

      if (retryFailed) {
        toast[result.geocoded > 0 ? "success" : "info"](
          result.geocoded > 0
            ? `${result.geocoded} endereço(s) localizados.`
            : "Nenhum endereço novo foi localizado.",
        );
      }
    } catch {
      toast.error("Erro ao preparar o mapa de entregas.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleOpenMap = () => {
    setMapOpen(true);
    runGeocoding();
  };

  // Clicar no pin fecha o mapa e leva até o card do pedido, destacado, pra
  // atribuir o motoboy sem ter que procurar na coluna.
  const handleSelectFromMap = (orderId: string) => {
    setMapOpen(false);
    setHighlightedOrderId(orderId);

    setTimeout(() => {
      document
        .getElementById(`order-${orderId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    setTimeout(() => setHighlightedOrderId(null), 4000);
  };

  if (!canAccess) {
    return (
      <p className="text-sm text-gray-500">
        Você não tem permissão para ver os pedidos.
      </p>
    );
  }

  // Loja sem delivery habilitado (Configurações) não tem pedido nenhum
  // pra passar por essas etapas — nem faz sentido mostrar o quadro vazio.
  if (settings && !settings.deliveryEnabled) {
    return (
      <p className="text-sm text-gray-400">
        Delivery está desativado nas Configurações — nenhum pedido passa por
        aqui.
      </p>
    );
  }

  const boardHeight = heightClassName ?? (compact ? "h-[440px]" : "h-full");
  const visibleColumns = columns
    ? COLUMNS.filter((column) => columns.includes(column.status))
    : COLUMNS;

  const city = settings?.city ?? "Ituiutaba";
  const state = settings?.state ?? "MG";

  // "A caminho" muda de perspectiva: em vez de uma lista solta, os pedidos
  // ficam agrupados pelo motoboy que está levando, com um cabeçalho por
  // motoboy (e o link da rota). As outras colunas seguem lista simples.
  const buildColumnItems = (column: ColumnConfig): ColumnItem[] => {
    const columnOrders = grouped[column.status];

    if (column.status !== "OutForDelivery") {
      return columnOrders.map((order) => ({ type: "order", order }));
    }

    const byDriver = new Map<
      string,
      { name: string; orders: KanbanOrder[] }
    >();

    for (const order of columnOrders) {
      const driverId = order.deliveryMan?.id ?? "sem-motoboy";
      const group = byDriver.get(driverId) ?? {
        name: order.deliveryMan?.fullName ?? "Sem motoboy",
        orders: [],
      };
      group.orders.push(order);
      byDriver.set(driverId, group);
    }

    const items: ColumnItem[] = [];
    for (const [driverId, group] of byDriver) {
      // A rota sai na ordem mais curta possível (vizinho mais próximo),
      // não na ordem em que os pedidos chegaram.
      const stops = sortByProximity(group.orders)
        .map((order) => fullAddress(order, city, state))
        .filter((stop): stop is string => stop !== null);

      items.push({
        type: "header",
        driverId,
        driverName: group.name,
        count: group.orders.length,
        routeUrl: stops.length > 0 ? buildRouteUrl(stops) : null,
      });
      group.orders.forEach((order) => items.push({ type: "order", order }));
    }

    return items;
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-shrink-0 items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`${compact ? "h-6 px-2 text-[11px]" : ""} hover:bg-cyan-600 hover:text-white`}
          onClick={handleOpenMap}
          title="Ver as entregas no mapa"
        >
          <MapIcon
            className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} mr-1`}
          />
          Mapa
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={compact ? "h-6 px-2 text-[11px]" : ""}
          onClick={() => loadOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} mr-1 ${refreshing ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Mapa de entregas */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Entregas em {city} - {state}
            </DialogTitle>
          </DialogHeader>

          {/* Legenda: mesma cor da coluna correspondente */}
          <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
            {(Object.keys(STATUS_LABELS) as KanbanOrderStatus[])
              .filter((status) => status !== "Delivered")
              .map((status) => (
                <span
                  key={status}
                  className="flex items-center gap-1 text-[11px] text-gray-600"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  {STATUS_LABELS[status]}
                </span>
              ))}
            <span className="ml-auto text-[11px] text-gray-400">
              {locatedCount} de {mapOrders.length} no mapa
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
            {geocoding && locatedCount === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Localizando os endereços...
                <span className="text-[11px] text-gray-400">
                  Pode levar alguns segundos na primeira vez de cada endereço.
                </span>
              </div>
            ) : mapCenter ? (
              <DeliveryMap
                orders={mapOrders}
                center={mapCenter}
                onSelectOrder={handleSelectFromMap}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500">
                Não consegui localizar &quot;{city} - {state}&quot; no mapa.
                Confira a cidade nas Configurações.
              </div>
            )}
          </div>

          {geocoding && locatedCount > 0 && (
            <p className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Localizando endereços novos...
            </p>
          )}

          {/* Sem isso, um pedido some do mapa sem explicação nenhuma. */}
          {!geocoding && unlocatedOrders.length > 0 && (
            <div className="max-h-24 flex-shrink-0 overflow-y-auto rounded-md border border-yellow-500 bg-yellow-100 p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-yellow-800">
                  {unlocatedOrders.length} pedido(s) fora do mapa — endereço
                  não encontrado
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 flex-shrink-0 px-2 text-[10px]"
                  onClick={() => runGeocoding(true)}
                >
                  Tentar de novo
                </Button>
              </div>
              {unlocatedOrders.map((order) => (
                <p key={order.id} className="text-[10px] text-yellow-800">
                  <span className="font-medium">{order.buyerName}</span>
                  {order.address
                    ? ` — ${order.address.address}, ${order.address.number} (${order.address.district})`
                    : " — sem endereço cadastrado"}
                </p>
              ))}
              <p className="mt-1 text-[10px] text-yellow-700">
                Corrija o endereço em Vendas → Editar e clique em “Tentar de
                novo”.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de cancelamento. Diz exatamente o que vai acontecer
          com o estoque, porque essa é a parte que não dá pra desfazer com
          um clique. */}
      <Dialog
        open={cancelTarget != null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar pedido?</DialogTitle>
          </DialogHeader>

          {cancelTarget && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Pedido de{" "}
                <strong className="text-gray-900">
                  {cancelTarget.buyerName}
                </strong>
                {cancelTarget.address
                  ? `, ${cancelTarget.address.address}, ${cancelTarget.address.number}`
                  : ""}
                .
              </p>

              <div className="rounded-md border bg-gray-50 p-2">
                <p className="mb-1 text-xs font-medium text-gray-600">
                  Volta pro estoque:
                </p>
                <ul className="space-y-0.5">
                  {cancelTarget.products.map((product) => (
                    <li key={product.id} className="text-xs text-gray-700">
                      {product.quantity}x {product.productName}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-500">
                O pedido sai do Kanban e os produtos voltam pro estoque. Essa
                ação não pode ser desfeita por aqui.
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCancelTarget(null)}
                >
                  Manter pedido
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  onClick={handleConfirmCancel}
                >
                  Cancelar pedido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando pedidos...
        </div>
      ) : (
        <div className={`flex ${boardHeight} ${s.columnGap}`}>
          {visibleColumns.map((column) => {
            const columnOrders = grouped[column.status];
            return (
              <div
                key={column.status}
                className="flex h-full min-w-0 flex-1 flex-col rounded-md border bg-gray-50"
              >
                <div
                  className={`flex flex-shrink-0 items-center justify-between rounded-t-md font-semibold text-white ${column.header} ${s.columnHeader}`}
                >
                  <span className="truncate">{column.title}</span>
                  <span
                    className={`flex-shrink-0 rounded-full bg-white/20 ${s.countBadge}`}
                  >
                    {columnOrders.length}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5 overflow-y-auto p-1.5">
                  {columnOrders.length === 0 ? (
                    <p className="pt-3 text-center text-[10px] text-gray-400">
                      Nenhum pedido nessa etapa.
                    </p>
                  ) : (
                    buildColumnItems(column).map((item) => {
                      // Cabeçalho de motoboy (só na coluna "A caminho")
                      if (item.type === "header") {
                        return (
                          <div
                            key={`driver-${item.driverId}`}
                            className="flex items-center gap-1 rounded-md bg-cyan-100 px-1.5 py-1"
                          >
                            <Truck className="h-3 w-3 flex-shrink-0 text-cyan-800" />
                            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-cyan-900">
                              {item.driverName}
                            </span>
                            <span className="flex-shrink-0 text-[10px] text-cyan-700">
                              {item.count}
                            </span>
                            {item.routeUrl && (
                              <a
                                href={item.routeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Abrir rota das ${item.count} entrega(s) de ${item.driverName} no Google Maps`}
                                className="flex-shrink-0 rounded p-0.5 text-cyan-800 hover:bg-cyan-200"
                              >
                                <MapPinned className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      }

                      const order = item.order;
                      const SourceIcon =
                        SOURCE_ICONS[order.orderSource ?? ""] ?? Phone;
                      const isBusy = busyOrderId === order.id;
                      const checkedCount = order.products.filter(
                        (p) => p.checked,
                      ).length;

                      return (
                        <div
                          key={order.id}
                          id={`order-${order.id}`}
                          className={`${s.cardGap} rounded-md border bg-white ${s.cardPadding} shadow-sm ${
                            highlightedOrderId === order.id
                              ? "ring-2 ring-cyan-500 ring-offset-1"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex min-w-0 items-start gap-1">
                              {PREVIOUS_STATUS[column.status] && (
                                <button
                                  type="button"
                                  title="Voltar pra etapa anterior"
                                  disabled={isBusy}
                                  onClick={() => handleRevert(order.id)}
                                  className="mt-0.5 flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <div className="min-w-0">
                                <p
                                  className={`truncate font-semibold text-gray-900 ${s.buyerName}`}
                                >
                                  {order.buyerName}
                                </p>
                                {order.address && (
                                  <p
                                    className={`flex items-center gap-1 truncate text-gray-500 ${s.address}`}
                                    title={`${order.address.address}, ${order.address.number} — ${order.address.district}`}
                                  >
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    {order.address.address},{" "}
                                    {order.address.number} —{" "}
                                    {order.address.district}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              title={
                                SOURCE_LABELS[order.orderSource ?? ""] ??
                                order.orderSource ??
                                "—"
                              }
                              className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 ${s.sourceIcon}`}
                            >
                              <SourceIcon className={s.sourceIconInner} />
                            </span>

                            {/* Cancelar: discreto de propósito, só ganha
                                cor vermelha no hover. */}
                            <button
                              type="button"
                              title="Cancelar pedido"
                              disabled={isBusy}
                              onClick={() => setCancelTarget(order)}
                              className="mt-0.5 flex-shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Lista de produtos */}
                          {column.status === "Preparing" ? (
                            <div
                              className={`space-y-1 rounded-md border bg-gray-50 ${s.checklistBox}`}
                            >
                              {order.products.map((product) => (
                                <label
                                  key={product.id}
                                  className={`flex cursor-pointer items-center gap-1.5 text-gray-700 ${s.checklistText}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={product.checked}
                                    disabled={isBusy}
                                    onChange={(e) =>
                                      handleToggleItem(
                                        order.id,
                                        product.id,
                                        e.target.checked,
                                      )
                                    }
                                    className="h-3.5 w-3.5"
                                  />
                                  <span
                                    className={
                                      product.checked
                                        ? "text-gray-400 line-through"
                                        : ""
                                    }
                                  >
                                    {product.quantity}x {product.productName}
                                  </span>
                                </label>
                              ))}
                              <p className={`pt-0.5 text-gray-400 ${s.footerNote}`}>
                                {checkedCount}/{order.products.length} conferidos
                              </p>
                            </div>
                          ) : (
                            <p
                              className={`truncate text-gray-500 ${s.productList}`}
                              title={order.products
                                .map((p) => `${p.quantity}x ${p.productName}`)
                                .join(", ")}
                            >
                              {order.products
                                .map((p) => `${p.quantity}x ${p.productName}`)
                                .join(", ")}
                            </p>
                          )}

                          {/* Rodapé por coluna */}
                          {column.status === "Confirmed" && (
                            <Button
                              type="button"
                              size="sm"
                              className={`w-full bg-black text-white hover:bg-amber-600 ${s.buttonHeight}`}
                              disabled={isBusy}
                              onClick={() => handleStartPreparing(order.id)}
                            >
                              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                              Iniciar preparo
                            </Button>
                          )}

                          {column.status === "ReadyToPickup" && (
                            <div className="space-y-1.5">
                              <select
                                value={selectedDriver[order.id] ?? defaultDriverId}
                                onChange={(e) =>
                                  setSelectedDriver((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                className={`w-full rounded-md border border-input bg-white px-1.5 ${s.buttonHeight}`}
                              >
                                <option value="">Motoboy...</option>
                                {deliveryMen.map((man) => (
                                  <option key={man.id} value={man.id}>
                                    {man.fullName}
                                    {man.accountType === "Admin" ? " (Admin)" : ""}
                                  </option>
                                ))}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                className={`w-full bg-black text-white hover:bg-cyan-600 ${s.buttonHeight}`}
                                disabled={isBusy || deliveryMen.length === 0}
                                onClick={() => handleAssignDriver(order.id)}
                              >
                                Enviar
                              </Button>
                            </div>
                          )}

                          {/* O motoboy já aparece no cabeçalho do grupo */}
                          {column.status === "OutForDelivery" && (
                            <Button
                              type="button"
                              size="sm"
                              className={`w-full bg-black text-white hover:bg-green-600 ${s.buttonHeight}`}
                              disabled={isBusy}
                              onClick={() => handleMarkDelivered(order.id)}
                            >
                              Marcar como entregue
                            </Button>
                          )}

                          {column.status === "Delivered" && order.deliveryMan && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full bg-green-100 font-semibold text-green-800 ${s.badge}`}
                            >
                              <Truck className="h-3 w-3" />
                              {order.deliveryMan.fullName}
                            </span>
                          )}

                          <p className={`text-right text-gray-400 ${s.footerNote}`}>
                            {column.status === "Delivered"
                              ? `Entregue ${formatDateTime(order.updatedAt)}`
                              : `Recebido ${formatTime(order.createdAt)}`}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersKanbanBoard;
