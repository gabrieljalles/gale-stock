"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { AuthContext } from "@/_store/auth/AuthContext";
import { CartProvider, useCart, unitPriceFor } from "@/_store/cart/CartContext";
import { Button } from "@/_components/ui/button";
import AddressForm, {
  AddressFormValue,
  emptyAddress,
  isAddressComplete,
  toPayload,
  TYPE_ADDRESS_OPTIONS,
} from "@/_components/storefront/AddressForm";
import { getMyAddresses, getMyProfile, MyAddress, MyProfile } from "@/api/user";
import {
  addItemsToMyOrder,
  createCustomerOrder,
  getMyDeliveryStatus,
  MyDeliveryStatus,
} from "@/api/order";
import { getPublicSettings, PublicSettings } from "@/api/storefront";
import { formatPoints, PointsQuote, quotePoints } from "@/api/points";
import PointsCheckoutSection from "./_components/PointsCheckoutSection";
import { transactionTypes } from "@/_constants/transaction";
import { formatCurrency } from "@/_utils/formatCurrency";

// Boleto não faz sentido numa entrega de bebida; notinha entra só pra quem
// a loja autorizou (ver filtro abaixo).
const BASE_PAYMENT_METHODS = transactionTypes.filter(
  (method) => method.value !== "BankSlip" && method.value !== "OnTheBill",
);

const typeLabel = (value: string) =>
  TYPE_ADDRESS_OPTIONS.find((option) => option.value === value)?.label ?? value;

const CheckoutContent = () => {
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [addresses, setAddresses] = useState<MyAddress[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressFormValue>(emptyAddress());
  const [paymentMethod, setPaymentMethod] = useState(
    BASE_PAYMENT_METHODS[0].value,
  );
  const [submitting, setSubmitting] = useState(false);

  // Pontos: o campo guarda texto porque number puro atrapalha apagar e
  // redigitar; quem manda no valor efetivo é sempre a cotação do servidor.
  const [redeemInput, setRedeemInput] = useState("");
  const [pointsQuote, setPointsQuote] = useState<PointsQuote | null>(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/checkout");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMyProfile(),
      getMyAddresses(),
      getPublicSettings(),
      getMyDeliveryStatus(),
    ])
      .then(([myProfile, myAddresses, publicSettings, status]) => {
        setDeliveryStatus(status);
        // Havendo pedido aberto que ainda aceita itens, a opção de
        // juntar vem marcada: é a que sai mais barato pro cliente.
        if (status.editableOrder) setAddToExisting(true);
        setProfile(myProfile);
        setAddresses(myAddresses);
        setSettings(publicSettings);
        // Já vem com o principal escolhido; sem endereço salvo, abre o
        // formulário direto pra não deixar a tela num beco sem saída.
        const primary =
          myAddresses.find((address) => address.isPrimary) ?? myAddresses[0];
        if (primary) setSelectedAddressId(primary.id);
        else setUseNewAddress(true);
      })
      .catch(() => toast.error("Erro ao carregar seus dados."))
      .finally(() => setLoading(false));
  }, [user]);

  // "Notinha" só aparece pra quem a loja autorizou — mostrar e receber 403
  // depois seria só frustração.
  const [deliveryStatus, setDeliveryStatus] =
    useState<MyDeliveryStatus | null>(null);
  const [addToExisting, setAddToExisting] = useState(false);

  const editableOrder = deliveryStatus?.editableOrder ?? null;
  // Juntar ao pedido que ainda está sendo montado significa a mesma
  // viagem, então o frete não entra de novo.
  const joiningExistingOrder = addToExisting && editableOrder != null;

  const freight = joiningExistingOrder ? 0 : (settings?.freightPrice ?? 0);

  // O desconto vem da cotação do servidor, nunca da conta feita aqui: é o
  // servidor que aplica saldo, mínimo e teto percentual, e o total exibido
  // tem que ser o mesmo que ele vai cobrar.
  const pointsDiscount = joiningExistingOrder
    ? 0
    : (pointsQuote?.redeemDiscount ?? 0);
  const total = subtotal + freight - pointsDiscount;
  const storeClosed = settings != null && !settings.storeOpen;

  // Sem vaga na fila e sem pedido pra juntar, não há o que fazer aqui.
  const queueFull =
    deliveryStatus != null &&
    !deliveryStatus.canPlaceNewOrder &&
    editableOrder == null;

  const paymentMethods = useMemo(() => {
    if (!profile?.canPayOnTheBill) return BASE_PAYMENT_METHODS;

    // Autorizado e ainda com folga no limite. O servidor barra de novo na
    // hora do pedido - aqui e so pra nao oferecer o que vai dar erro.
    if (profile.onTheBillAvailable < total) return BASE_PAYMENT_METHODS;

    const onTheBill = transactionTypes.find(
      (method) => method.value === "OnTheBill",
    );
    return onTheBill
      ? [...BASE_PAYMENT_METHODS, onTheBill]
      : BASE_PAYMENT_METHODS;
  }, [profile, total]);

  // Autorizado, mas o carrinho nao cabe no que sobrou: explica em vez de
  // simplesmente sumir com a opcao.
  const onTheBillBlocked =
    profile?.canPayOnTheBill === true && profile.onTheBillAvailable < total;


  // Se a notinha estava selecionada e deixou de estar disponivel (o
  // carrinho cresceu), volta pro primeiro metodo em vez de enviar algo que
  // o servidor vai recusar.
  useEffect(() => {
    if (
      paymentMethod === "OnTheBill" &&
      !paymentMethods.some((method) => method.value === "OnTheBill")
    ) {
      setPaymentMethod(paymentMethods[0].value);
    }
  }, [paymentMethod, paymentMethods]);

  /**
   * Cotação dos pontos.
   *
   * Refeita a cada mudança de carrinho, forma de pagamento ou quantidade
   * resgatada, com uma pausa curta pra não disparar uma requisição por
   * tecla digitada. O servidor é quem decide o número que aparece na tela —
   * prometer aqui um ganho que ele não vai pagar é o pior erro possível
   * numa tela de checkout.
   */
  useEffect(() => {
    if (!user || joiningExistingOrder) {
      setPointsQuote(null);
      return;
    }

    let cancelled = false;
    setQuoting(true);
    const timer = setTimeout(() => {
      quotePoints({
        productTotal: subtotal,
        transactionType: paymentMethod,
        pointsToRedeem: Number(redeemInput) || 0,
      })
        .then((quote) => {
          if (!cancelled) setPointsQuote(quote);
        })
        .catch(() => {
          // Programa fora do ar não pode impedir a compra: a seção some e
          // o pedido segue normalmente.
          if (!cancelled) setPointsQuote(null);
        })
        .finally(() => {
          if (!cancelled) setQuoting(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, subtotal, paymentMethod, redeemInput, joiningExistingOrder]);

  const handleSubmit = async () => {
    if (lines.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    // Juntando ao pedido existente, o endereço é o dele - não há o que
    // validar aqui.
    if (!joiningExistingOrder) {
      if (useNewAddress && !isAddressComplete(newAddress)) {
        toast.error("Preencha endereço, número e bairro da entrega.");
        return;
      }
      if (!useNewAddress && !selectedAddressId) {
        toast.error("Escolha um endereço de entrega.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const items = lines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      }));

      if (joiningExistingOrder) {
        // Junta no pedido que ainda não foi montado: endereço e forma de
        // pagamento continuam os do pedido original, porque é ele mesmo.
        await addItemsToMyOrder(editableOrder!.id, items);
        clear();
        toast.success("Produtos adicionados ao seu pedido!");
        router.push("/meus-pedidos");
        return;
      }

      await createCustomerOrder({
        orderDetails: items,
        transactionType: paymentMethod,
        // Manda o que o servidor já validou na cotação, não o que está
        // digitado: assim a tela nunca envia um resgate que ela mesma
        // acabou de mostrar como inválido.
        pointsToRedeem: pointsQuote?.redeemPoints || undefined,
        ...(useNewAddress
          ? { orderAddress: toPayload(newAddress) as any }
          : { userAddressId: selectedAddressId! }),
      });

      clear();
      toast.success("Pedido enviado! A loja já está preparando.");
      router.push("/meus-pedidos");
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Não foi possível enviar seu pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-gray-600">Seu carrinho está vazio.</p>
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-secondary hover:text-primary"
        >
          Escolher produtos
        </Link>
      </div>
    );
  }

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

        <h1 className="mb-5 text-2xl font-bold text-gray-900">
          Finalizar pedido
        </h1>

        {/* Existe um pedido que ainda não foi montado: dá pra juntar tudo
            numa entrega só. A escolha é explícita porque muda o preço. */}
        {editableOrder && (
          <section className="mb-4 rounded-lg border border-blue-500 bg-blue-50 p-4">
            <h2 className="mb-1 font-semibold text-blue-900">
              Você já tem um pedido sendo preparado
            </h2>
            <p className="mb-3 text-sm text-blue-900">
              São {editableOrder.itemCount} item(ns), no valor de{" "}
              {formatCurrency(editableOrder.totalPrice)}. Como ele ainda não
              saiu para entrega, dá para juntar as duas compras.
            </p>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-blue-500 bg-white p-2.5">
                <input
                  type="radio"
                  name="joinOrder"
                  checked={addToExisting}
                  onChange={() => setAddToExisting(true)}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">
                    Juntar no pedido que já fiz
                  </span>
                  <span className="block text-xs text-gray-600">
                    Chega tudo de uma vez e você{" "}
                    <strong>não paga a entrega de novo</strong>.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-white p-2.5">
                <input
                  type="radio"
                  name="joinOrder"
                  checked={!addToExisting}
                  onChange={() => setAddToExisting(false)}
                  disabled={!deliveryStatus?.canPlaceNewOrder}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">
                    Fazer um pedido separado
                  </span>
                  <span className="block text-xs text-gray-600">
                    Chega em outra entrega e paga{" "}
                    {formatCurrency(settings?.freightPrice ?? 0)} de taxa.
                    {!deliveryStatus?.canPlaceNewOrder &&
                      " Indisponível: você já atingiu o limite de pedidos em andamento."}
                  </span>
                </span>
              </label>
            </div>
          </section>
        )}

        {/* Fila cheia e nenhum pedido para juntar: não há o que fazer aqui. */}
        {queueFull && (
          <section className="mb-4 rounded-lg border border-yellow-600 bg-yellow-100 p-4">
            <h2 className="mb-1 font-semibold text-yellow-800">
              Você já tem {deliveryStatus?.openOrderCount} pedidos a caminho
            </h2>
            <p className="text-sm text-yellow-800">
              Para fazer um novo pedido, espere um dos seus pedidos atuais ser
              entregue. Assim que chegar, essa tela libera sozinha.
            </p>
            <Link
              href="/meus-pedidos"
              className="mt-2 inline-block text-sm font-medium text-yellow-800 underline"
            >
              Acompanhar meus pedidos
            </Link>
          </section>
        )}

        {storeClosed && (
          <p className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-800">
            A loja está fechada no momento, então não dá pra enviar o pedido
            agora. Seu carrinho fica salvo até ela abrir.
          </p>
        )}

        {/* Endereço */}
        <section className="mb-4 rounded-lg border bg-white p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <MapPin className="h-4 w-4" />
            Endereço de entrega
          </h2>

          <div className="space-y-2">
            {addresses.map((address) => {
              const selected = !useNewAddress && selectedAddressId === address.id;
              return (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => {
                    setUseNewAddress(false);
                    setSelectedAddressId(address.id);
                  }}
                  className={`flex w-full items-start gap-2 rounded-md border p-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-primary bg-primary" : "border-gray-300"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-900">
                      {typeLabel(address.typeAddress)} {address.address},{" "}
                      {address.number}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {address.district}
                      {address.complement ? ` · ${address.complement}` : ""}
                    </span>
                  </span>
                  {address.isPrimary && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                      Principal
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setUseNewAddress(true)}
              className={`flex w-full items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
                useNewAddress
                  ? "border-primary bg-primary/5"
                  : "border-dashed border-gray-300 hover:border-primary"
              }`}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              Entregar em outro endereço
            </button>

            {useNewAddress && (
              <div className="rounded-md border bg-gray-50 p-3">
                <AddressForm value={newAddress} onChange={setNewAddress} />
                <p className="mt-2 text-xs text-gray-400">
                  Esse endereço vale só para este pedido. Para guardá-lo, use{" "}
                  <Link
                    href="/minha-conta"
                    className="underline hover:text-primary"
                  >
                    Minha conta
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Pagamento */}
        <section className="mb-4 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold text-gray-900">
            Forma de pagamento
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  paymentMethod === method.value
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
          {onTheBillBlocked && (
            <p className="mt-2 rounded-md bg-gray-100 p-2 text-xs text-gray-600">
              A opção <strong>Notinha</strong> não aparece porque este
              pedido passa do seu limite. Você tem{" "}
              {formatCurrency(profile?.onTheBillAvailable ?? 0)} disponível de{" "}
              {formatCurrency(profile?.onTheBillLimit ?? 0)}. Quitando a conta
              com a loja, ela volta a aparecer.
            </p>
          )}

          {paymentMethod === "OnTheBill" ? (
            <p className="mt-2 text-xs text-gray-500">
              A conta fica em aberto e você acerta depois com a loja.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              O pagamento é feito na entrega.
            </p>
          )}
        </section>

        {/* Pontos: ganho em destaque e resgate logo abaixo. Fica depois do
            pagamento porque o ganho depende da forma escolhida. */}
        {!joiningExistingOrder && (
          <PointsCheckoutSection
            quote={pointsQuote}
            loading={quoting}
            redeemInput={redeemInput}
            onChangeRedeem={setRedeemInput}
            isOnTheBill={paymentMethod === "OnTheBill"}
          />
        )}

        {/* Resumo */}
        <section className="mb-4 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Resumo</h2>
          <div className="space-y-1">
            {lines.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate text-gray-700">
                  {quantity}x {product.name}
                </span>
                <span className="flex-shrink-0 text-gray-900">
                  {formatCurrency(unitPriceFor(product, quantity) * quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Entrega</span>
              <span>{formatCurrency(freight)}</span>
            </div>
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  Desconto em pontos (
                  {formatPoints(pointsQuote?.redeemPoints ?? 0)} pts)
                </span>
                <span>− {formatCurrency(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        {/* Aviso discreto: o cliente precisa entender ANTES de fechar que
            existe um ponto sem volta. Texto curto, sem jargão. */}
        <p className="mb-3 text-xs leading-relaxed text-gray-400">
          <strong className="font-medium text-gray-500">Fique atento:</strong>{" "}
          você pode acrescentar produtos ao seu pedido enquanto ele ainda
          estiver <strong className="font-medium text-gray-500">sendo
          preparado</strong>. Depois que ele fica pronto e sai para entrega,
          não dá mais para incluir nada &mdash; aí é preciso fazer um pedido
          novo, e a taxa de entrega é cobrada outra vez.
        </p>

        <Button
          type="button"
          disabled={submitting || storeClosed}
          onClick={handleSubmit}
          className="w-full bg-primary py-6 text-base text-white hover:bg-secondary hover:text-primary"
        >
          {submitting ? "Enviando pedido..." : `Confirmar pedido · ${formatCurrency(total)}`}
        </Button>
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutContent />
    </CartProvider>
  );
}
