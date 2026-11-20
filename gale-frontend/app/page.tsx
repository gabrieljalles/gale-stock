"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2, Search, ShoppingCart } from "lucide-react";
import { CartProvider, useCart } from "@/_store/cart/CartContext";
import StorefrontHeader from "./_components/storefront/StorefrontHeader";
import ProductCard from "./_components/storefront/ProductCard";
import CartDrawer from "./_components/storefront/CartDrawer";
import { Input } from "./_components/ui/input";
import {
  getPublicSettings,
  getStorefrontCatalog,
  PublicSettings,
  StorefrontProduct,
} from "@/api/storefront";
import { translateCategory } from "@/_constants/product";
import { formatCurrency } from "@/_utils/formatCurrency";

const StorefrontContent = () => {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { itemCount, subtotal } = useCart();

  // ?preview=1 vem do botão "Ver como cliente" nas Configurações.
  const previewMode = useSearchParams().get("preview") === "1";

  useEffect(() => {
    Promise.all([getStorefrontCatalog(), getPublicSettings()])
      .then(([catalog, publicSettings]) => {
        setProducts(catalog);
        setSettings(publicSettings);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Só as categorias que têm produto agora — categoria vazia na vitrine
  // só gera clique frustrado.
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  );

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (!term) return true;
      return product.name.toLowerCase().includes(term);
    });
  }, [products, category, searchTerm]);

  const storeOpen = settings?.storeOpen ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      {previewMode && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-4 py-1.5 text-xs text-white">
          <span className="flex items-center gap-1.5 font-semibold">
            <Eye className="h-3.5 w-3.5" />
            Pré-visualização: é assim que o cliente vê a loja
          </span>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1 underline underline-offset-2 hover:text-secondary"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar às Configurações
          </Link>
        </div>
      )}

      <StorefrontHeader
        onOpenCart={() => setCartOpen(true)}
        previewMode={previewMode}
      />

      {/* Faixa de status: a primeira coisa que o cliente precisa saber é
          se dá pra pedir agora e quanto custa a entrega. Enquanto as
          configurações não chegam fica neutra — anunciar "Fechado" antes
          de saber espantaria o cliente à toa. */}
      <div
        className={`border-b ${
          settings == null
            ? "bg-gray-100"
            : storeOpen
              ? "bg-green-100"
              : "bg-red-100"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
          <span
            className={`flex items-center gap-1.5 font-semibold ${
              settings == null
                ? "text-gray-500"
                : storeOpen
                  ? "text-green-800"
                  : "text-red-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                settings == null
                  ? "bg-gray-400"
                  : storeOpen
                    ? "bg-green-600"
                    : "bg-red-600"
              }`}
            />
            {settings == null
              ? "Verificando..."
              : storeOpen
                ? "Aberto agora"
                : "Fechado no momento"}
          </span>

          {settings?.closesAt != null && storeOpen && (
            <span className="text-gray-600">Fecha às {settings.closesAt}</span>
          )}

          {settings?.deliveryEnabled && (
            <span className="text-gray-600">
              Entrega {formatCurrency(settings.freightPrice)}
            </span>
          )}

          {settings && (
            <span className="ml-auto text-gray-500">
              {settings.city} - {settings.state}
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bebida gelada, entregue rápido
        </h1>
        <p className="mb-5 text-sm text-gray-600">
          Escolha os produtos e finalize seu pedido.
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="bg-white pl-10"
          />
        </div>

        {categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                category === null
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-primary"
              }`}
            >
              Todos
            </button>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  category === item
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                }`}
              >
                {translateCategory(item)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando produtos...
          </div>
        ) : error ? (
          <p className="py-20 text-center text-sm text-gray-500">
            Não consegui carregar os produtos agora. Tente recarregar a página.
          </p>
        ) : visibleProducts.length === 0 ? (
          <p className="py-20 text-center text-sm text-gray-500">
            {products.length === 0
              ? "Nenhum produto disponível no momento."
              : "Nenhum produto encontrado com esse filtro."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Barra fixa: no celular o carrinho do topo sai de vista ao rolar */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-3 shadow-lg">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-md bg-primary px-4 py-3 text-white transition-colors hover:bg-secondary hover:text-primary"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4" />
              Ver carrinho ({itemCount})
            </span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </button>
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        settings={settings}
      />
    </div>
  );
};

export default function Home() {
  return (
    <CartProvider>
      {/* useSearchParams (o ?preview=1) exige um limite de Suspense */}
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </div>
        }
      >
        <StorefrontContent />
      </Suspense>
    </CartProvider>
  );
}
