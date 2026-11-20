"use client";

import Image from "next/image";
import { Minus, Package, Plus } from "lucide-react";
import { StorefrontProduct } from "@/api/storefront";
import { useCart, unitPriceFor } from "@/_store/cart/CartContext";
import { formatCurrency } from "@/_utils/formatCurrency";

interface ProductCardProps {
  product: StorefrontProduct;
}

// Com a loja fechada o cliente ainda pode montar o carrinho — o bloqueio
// acontece só no fechamento do pedido, no carrinho.
const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem, setQuantity, quantityOf } = useCart();
  const quantity = quantityOf(product.id);
  const unitPrice = unitPriceFor(product, Math.max(quantity, 1));
  const atMax = quantity >= product.maxQuantity;

  // Desconto por quantidade (atacado). Os dois campos andam juntos: sem um
  // deles não existe oferta pra mostrar.
  const bulkTarget = product.packageDiscountAmount;
  const bulkPrice = product.packagePrice;
  const hasBulkOffer = bulkTarget != null && bulkPrice != null && bulkTarget > 0;

  const bulkUnlocked = hasBulkOffer && quantity >= bulkTarget;
  const missingForBulk = hasBulkOffer ? Math.max(bulkTarget - quantity, 0) : 0;

  // Progresso rumo ao desconto. Trava em 100% pra barra não vazar quando o
  // cliente passa da quantidade mínima.
  const bulkProgress = hasBulkOffer
    ? Math.min((quantity / bulkTarget) * 100, 100)
    : 0;

  // Quanto o preço de atacado economiza por unidade, em %.
  const savingsPercent =
    hasBulkOffer && product.price > 0
      ? Math.round((1 - bulkPrice / product.price) * 100)
      : 0;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-md ${
        bulkUnlocked ? "jackpot-border" : "border"
      }`}
    >
      <div className="relative aspect-square bg-gray-50">
        {product.imgUrl ? (
          <Image
            src={product.imgUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
        )}

        {/* Empilhado: um produto pode estar em liquidação e em promoção */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.isLiquidation && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Liquidação
            </span>
          )}
          {product.isPromotion && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
              Promoção
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500">
          {product.size}
          {product.sizeType}
        </p>

        {/* Preço à esquerda, economia conquistada na ponta oposta */}
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(unitPrice)}
          </p>
          {bulkUnlocked && savingsPercent > 0 && (
            <span
              className="jackpot-text flex-shrink-0 text-xs font-extrabold"
              title={`Você está economizando ${savingsPercent}% por unidade`}
            >
              {savingsPercent}%
            </span>
          )}
        </div>

        {/* Atacado é argumento de venda: o cliente precisa ver a oferta */}
        {hasBulkOffer && (
          <p className="text-[11px] font-medium text-green-600">
            {bulkTarget}+ un: {formatCurrency(bulkPrice)} cada
          </p>
        )}

        <div className="mt-auto pt-2">
          {/* Barra de progresso do desconto, logo acima do botão. Some
              quando o produto não tem oferta de atacado. */}
          {hasBulkOffer && (
            <div className="mb-1.5">
              <div className="mb-0.5 flex items-center justify-between gap-1 text-[10px]">
                {bulkUnlocked ? (
                  <span className="jackpot-text font-extrabold">
                    Desconto liberado!
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {missingForBulk === 1
                      ? "Falta 1 un. pro desconto"
                      : `Faltam ${missingForBulk} un. pro desconto`}
                  </span>
                )}
                <span className="flex-shrink-0 text-gray-400">
                  {Math.min(quantity, bulkTarget)}/{bulkTarget}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    bulkUnlocked ? "jackpot-fill" : "bg-green-500"
                  }`}
                  style={{ width: `${bulkProgress}%` }}
                />
              </div>
            </div>
          )}

          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(product)}
              className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-secondary hover:text-primary"
            >
              Adicionar
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-md border">
              <button
                type="button"
                aria-label={`Diminuir ${product.name}`}
                onClick={() => setQuantity(product.id, quantity - 1)}
                className="px-3 py-2 text-gray-600 hover:text-primary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                aria-label={`Aumentar ${product.name}`}
                disabled={atMax}
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:text-primary disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          {atMax && quantity > 0 && (
            <p className="pt-1 text-center text-[10px] text-gray-400">
              Máximo disponível
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
