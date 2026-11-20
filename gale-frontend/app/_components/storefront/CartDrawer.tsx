"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { Button } from "@/_components/ui/button";
import { Minus, Package, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart, unitPriceFor } from "@/_store/cart/CartContext";
import { AuthContext } from "@/_store/auth/AuthContext";
import { formatCurrency } from "@/_utils/formatCurrency";
import { PublicSettings } from "@/api/storefront";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PublicSettings | null;
}

const CartDrawer = ({ open, onOpenChange, settings }: CartDrawerProps) => {
  const { lines, subtotal, setQuantity, removeItem } = useCart();
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const freight = settings?.deliveryEnabled ? (settings?.freightPrice ?? 0) : 0;
  const total = subtotal + (lines.length > 0 ? freight : 0);
  const storeClosed = settings != null && !settings.storeOpen;

  // Pedido exige conta: quem não está logado vai pro login e volta pro
  // checkout depois. O carrinho fica salvo, então nada se perde no caminho.
  const handleCheckout = () => {
    onOpenChange(false);
    router.push(user ? "/checkout" : "/login?redirect=/checkout");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="fixed right-0 top-0 flex h-screen w-full max-w-[400px] flex-col rounded-none border-l bg-white">
        <DrawerHeader className="flex-shrink-0 border-b py-3">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Seu carrinho
          </DrawerTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar carrinho"
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-3">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Seu carrinho está vazio.</p>
              <p className="text-xs text-gray-400">
                Escolha os produtos e eles aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lines.map(({ product, quantity }) => {
                const unitPrice = unitPriceFor(product, quantity);
                return (
                  <div
                    key={product.id}
                    className="flex gap-2 rounded-md border p-2"
                  >
                    <div className="relative h-14 w-14 flex-shrink-0 rounded bg-gray-50">
                      {product.imgUrl ? (
                        <Image
                          src={product.imgUrl}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <Package className="m-auto h-6 w-6 text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(unitPrice)} cada
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center rounded border">
                          <button
                            type="button"
                            aria-label="Diminuir"
                            onClick={() => setQuantity(product.id, quantity - 1)}
                            className="px-1.5 py-1 text-gray-600 hover:text-primary"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Aumentar"
                            disabled={quantity >= product.maxQuantity}
                            onClick={() => setQuantity(product.id, quantity + 1)}
                            className="px-1.5 py-1 text-gray-600 hover:text-primary disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="ml-auto text-sm font-bold">
                          {formatCurrency(unitPrice * quantity)}
                        </span>

                        <button
                          type="button"
                          aria-label={`Remover ${product.name}`}
                          onClick={() => removeItem(product.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="flex-shrink-0 space-y-2 border-t p-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {settings?.deliveryEnabled && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Entrega</span>
                <span>{formatCurrency(freight)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {storeClosed && (
              <p className="rounded-md bg-red-100 p-2 text-center text-xs text-red-800">
                A loja está fechada agora. Você pode montar o carrinho e
                finalizar quando ela abrir.
              </p>
            )}

            <Button
              type="button"
              disabled={storeClosed}
              onClick={handleCheckout}
              className="w-full bg-primary text-white hover:bg-secondary hover:text-primary"
            >
              {user ? "Finalizar pedido" : "Entrar e finalizar"}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
