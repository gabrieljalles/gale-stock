"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChefHat,
  Loader2,
  PackageCheck,
  Receipt,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "@/_store/auth/AuthContext";
import { getMyOrders, MyOrder } from "@/api/order";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

/**
 * Como cada status do sistema aparece pro cliente.
 *
 * Os nomes internos não servem: "ReadyToPickup" não diz nada pra quem está
 * esperando em casa. Aqui vira "Pronto para entrega".
 */
const STATUS_VIEW: Record<
  string,
  { label: string; icon: typeof ChefHat; className: string }
> = {
  Confirmed: {
    label: "Pedido recebido",
    icon: Receipt,
    className: "bg-gray-100 text-gray-700",
  },
  Placed: {
    label: "Pedido recebido",
    icon: Receipt,
    className: "bg-gray-100 text-gray-700",
  },
  Preparing: {
    label: "Em preparo",
    icon: ChefHat,
    className: "bg-yellow-100 text-yellow-800",
  },
  ReadyToPickup: {
    label: "Pronto para entrega",
    icon: PackageCheck,
    className: "bg-blue-50 text-blue-700",
  },
  OutForDelivery: {
    label: "A caminho",
    icon: Bike,
    className: "bg-purple-100 text-purple-800",
  },
  Delivered: {
    label: "Entregue",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800",
  },
  Concluded: {
    label: "Concluído",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800",
  },
  PickedUp: {
    label: "Retirado — pagamento pendente",
    icon: Receipt,
    className: "bg-yellow-100 text-yellow-800",
  },
  OnAccount: {
    label: "Na notinha",
    icon: Receipt,
    className: "bg-yellow-100 text-yellow-800",
  },
  Cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-red-100 text-red-800",
  },
  DeliveryFailed: {
    label: "Entrega não concluída",
    icon: XCircle,
    className: "bg-red-100 text-red-800",
  },
};

const StatusBadge = ({ status }: { status: string }) => {
  const view = STATUS_VIEW[status] ?? {
    label: status,
    icon: Receipt,
    className: "bg-gray-100 text-gray-700",
  };
  const Icon = view.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${view.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {view.label}
    </span>
  );
};

const OrderCard = ({ order }: { order: MyOrder }) => (
  <div className="rounded-lg border bg-white p-4">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <StatusBadge status={order.orderStatus} />
      <span className="text-xs text-gray-500">
        {formatDateTime(order.createdAt)}
      </span>
    </div>

    <div className="space-y-0.5 border-t pt-2">
      {order.products.map((product) => (
        <div key={product.id} className="flex justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-gray-700">
            {product.quantity}x {product.productName}
          </span>
          <span className="flex-shrink-0 text-gray-600">
            {formatCurrency(product.totalPrice)}
          </span>
        </div>
      ))}

      {order.freightPrice > 0 && (
        <div className="flex justify-between gap-2 text-sm text-gray-500">
          <span>Entrega</span>
          <span>{formatCurrency(order.freightPrice)}</span>
        </div>
      )}
    </div>

    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
      <div className="min-w-0 text-xs text-gray-500">
        {order.address && (
          <p className="truncate">
            {order.address.address}, {order.address.number} —{" "}
            {order.address.district}
          </p>
        )}
        {order.deliveryManName && (
          <p className="truncate">Entregador: {order.deliveryManName}</p>
        )}
        {!order.isPaid && !order.isCancelled && (
          <p className="font-medium text-yellow-800">Pagamento pendente</p>
        )}
      </div>
      <span className="flex-shrink-0 font-semibold text-gray-900">
        {formatCurrency(order.totalPrice)}
      </span>
    </div>
  </div>
);

const MyOrdersPage = () => {
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();

  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/meus-pedidos");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    getMyOrders()
      .then(setOrders)
      .catch(() => toast.error("Erro ao carregar seus pedidos."))
      .finally(() => setLoading(false));
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  const openOrders = orders.filter((order) => order.isOpen);
  const finishedOrders = orders.filter((order) => !order.isOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à loja
        </Link>

        <h1 className="mb-4 text-2xl font-bold text-gray-900">Meus pedidos</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center">
            <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              Você ainda não fez nenhum pedido.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary hover:text-primary"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">
                Em aberto{" "}
                <span className="font-normal text-gray-400">
                  ({openOrders.length})
                </span>
              </h2>
              {openOrders.length === 0 ? (
                <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">
                  Nenhum pedido em andamento.
                </p>
              ) : (
                <div className="space-y-2">
                  {openOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>

            {finishedOrders.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-gray-900">
                  Finalizados{" "}
                  <span className="font-normal text-gray-400">
                    ({finishedOrders.length})
                  </span>
                </h2>
                <div className="space-y-2">
                  {finishedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
