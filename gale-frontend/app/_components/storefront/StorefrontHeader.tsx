"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
} from "lucide-react";
import { AuthContext } from "@/_store/auth/AuthContext";
import { useCart } from "@/_store/cart/CartContext";
import { getMyAddresses, getMyProfile, MyAddress } from "@/api/user";
import { formatPoints, getMyPoints, MyPointsSummary } from "@/api/points";
import { TYPE_ADDRESS_OPTIONS } from "./AddressForm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/_components/ui/popover";

const typeLabel = (value: string) =>
  TYPE_ADDRESS_OPTIONS.find((option) => option.value === value)?.label ?? value;

// Iniciais pro avatar: primeiro e último nome ("Gabriel Jalles Ferreira"
// vira "GF"). Nome de uma palavra só usa as duas primeiras letras.
const initialsOf = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// No header cabe pouco: mostra só os dois primeiros nomes. O nome completo
// aparece dentro do menu.
const firstNamesOf = (fullName: string): string =>
  fullName.trim().split(/\s+/).slice(0, 2).join(" ");

interface StorefrontHeaderProps {
  onOpenCart: () => void;
  // Em pré-visualização o atalho do painel some, pra a tela ficar igual à
  // que o cliente enxerga.
  previewMode?: boolean;
}

const StorefrontHeader = ({
  onOpenCart,
  previewMode = false,
}: StorefrontHeaderProps) => {
  const { user, signout } = useContext(AuthContext);
  const { itemCount } = useCart();
  const [primaryAddress, setPrimaryAddress] = useState<MyAddress | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [points, setPoints] = useState<MyPointsSummary | null>(null);

  // Mostra o endereço padrão de entrega no topo, como referência rápida.
  // Recarrega a cada montagem, então voltar de "Minha conta" depois de
  // trocar o principal já reflete aqui.
  useEffect(() => {
    if (!user) {
      setPrimaryAddress(null);
      setAvatarUrl(null);
      setPoints(null);
      return;
    }
    getMyAddresses()
      .then((addresses) => {
        setPrimaryAddress(
          addresses.find((address) => address.isPrimary) ?? addresses[0] ?? null,
        );
      })
      .catch(() => {
        // Sem endereço carregado o header mostra o convite pra cadastrar.
      });
    getMyProfile()
      .then((profile) => setAvatarUrl(profile.avatarUrl))
      .catch(() => {
        // Sem foto o avatar cai nas iniciais.
      });
    getMyPoints()
      .then(setPoints)
      .catch(() => {
        // Programa desligado ou fora do ar: o header simplesmente não
        // mostra o saldo, em vez de quebrar a navegação inteira.
      });
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <Image
            src="/light-logo-noname.png"
            alt="Início"
            width={38}
            height={38}
            priority
            className="transition-transform duration-300 hover:animate-float"
          />
          <span className="hidden text-lg font-bold text-primary sm:block">
            Galé
          </span>
        </Link>

        {/* Endereço de entrega padrão: leva direto pra gerenciar endereços */}
        {user && (
          <Link
            href="/minha-conta"
            title={
              primaryAddress
                ? "Trocar o endereço padrão de entrega"
                : "Cadastrar um endereço de entrega"
            }
            className="flex min-w-0 max-w-[240px] flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-100"
          >
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-[10px] leading-none text-gray-500">
                Entregar em
              </span>
              <span className="block truncate text-xs font-medium text-gray-900">
                {primaryAddress
                  ? `${typeLabel(primaryAddress.typeAddress)} ${primaryAddress.address}, ${primaryAddress.number}`
                  : "Adicionar endereço"}
              </span>
            </span>
            <ChevronRight className="hidden h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:block" />
          </Link>
        )}

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          {/* Saldo sempre em pontos inteiros: casa decimal aqui não ajuda
              ninguém a decidir nada, e ocupa a largura que o header não tem. */}
          {user && points?.enabled && (
            <Link
              href="/minha-conta/pontos"
              title="Ver meus pontos"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1.5 text-amber-800 transition-colors hover:bg-amber-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-sm font-bold tabular-nums">
                {formatPoints(points.balance)}
              </span>
              <span className="hidden text-xs sm:inline">pts</span>
            </Link>
          )}

          {user ? (
            /* Avatar com iniciais + seta: a convenção que as pessoas já
               reconhecem como "área da minha conta". Junta num só lugar o
               que antes eram três elementos soltos no header. */
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu da conta"
                  className="flex max-w-[190px] items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
                >
                  {avatarUrl ? (
                    <span className="relative h-8 w-8 flex-shrink-0">
                      <Image
                        src={avatarUrl}
                        alt=""
                        fill
                        sizes="32px"
                        className="rounded-full object-cover"
                      />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {initialsOf(user.name)}
                    </span>
                  )}
                  <span className="hidden min-w-0 truncate text-sm text-gray-800 sm:block">
                    {firstNamesOf(user.name)}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 flex-shrink-0 text-gray-500 sm:block" />
                </button>
              </PopoverTrigger>

              {/* bg-white/text-gray explícitos: o popover base usa
                  bg-popover, que não existe na paleta deste projeto e
                  deixaria o menu transparente. */}
              <PopoverContent
                align="end"
                className="w-56 bg-white p-1 text-gray-900"
              >
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>

                <Link
                  href="/minha-conta"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  Minha conta
                </Link>

                <Link
                  href="/meus-pedidos"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Meus pedidos
                </Link>

                <Link
                  href="/minha-conta/pontos"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Sparkles className="h-4 w-4" />
                  Meus pontos
                  {points?.enabled && (
                    <span className="ml-auto text-xs font-bold text-amber-600">
                      {formatPoints(points.balance)}
                    </span>
                  )}
                </Link>

                {/* Quem é da equipe chega no painel pela própria vitrine */}
                {!previewMode &&
                  (user.role === "Admin" || user.role === "Shopper") && (
                    <Link
                      href="/admin/resume"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Painel
                    </Link>
                  )}

                <button
                  type="button"
                  onClick={signout}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border-t px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              {/* Quem ainda não tem conta descobre o programa por aqui — é
                  o único ponto de entrada visível pra visitante. */}
              <Link
                href="/pontos"
                className="hidden items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200 sm:flex"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ganhe pontos
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary"
              >
                <User className="h-4 w-4" />
                Entrar
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Abrir carrinho com ${itemCount} item(s)`}
            className="relative rounded-md bg-primary p-2.5 text-white transition-colors hover:bg-secondary hover:text-primary"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-primary ring-2 ring-white">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default StorefrontHeader;
