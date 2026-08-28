"use client";

import { usePathname } from "next/navigation"; // Next 13+ (App Router)
// import { useRouter } from "next/router";     // Next 12 (Pages Router)
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/_components/ui/button";

interface NavButton {
  label: string;
  href: string;
  iconPath: string;
  customClass?: string;
}

const navItems: NavButton[] = [
  {
    label: "Resumo",
    href: "/admin/resume",
    iconPath: "/admin/ShoppingMall.svg",
    customClass: "bg-[#fff]",
  },
  {
    label: "Catálogo",
    href: "/admin/catalog",
    iconPath: "/admin/menu.svg",
    customClass: "bg-[#93C5FD]",
  },
  {
    label: "Promoções",
    href: "/admin/discount",
    iconPath: "/admin/Discount.svg",
    customClass: "bg-[#FCA5A5]",
  },
  {
    label: "Pedidos",
    href: "/admin/orders",
    iconPath: "/admin/Notepad.svg",
    customClass: "bg-[#D8B4FE]",
  },
  {
    label: "Vendas",
    href: "/admin/sells",
    iconPath: "/admin/Vector.svg",
    customClass: "bg-[#FDBA74]",
  },
  {
    label: "Estoque",
    href: "/admin/stock",
    iconPath: "/admin/estoque.svg",
    customClass: "bg-[#7DF1CC]",
  },
  {
    label: "Usuários",
    href: "/admin/users",
    iconPath: "/admin/User.svg",
    customClass: "bg-[#67E8F9]",
  },
  {
    label: "Dashboard",
    href: "/admin/finance",
    iconPath: "/admin/dashboard.svg",
    customClass: "bg-[#FFD700]",
  },
  {
    label: "Financeiro",
    href: "/admin/financeiro",
    iconPath: "/admin/financas.svg",
    customClass: "bg-[#D9F99D]",
  },
  {
    label: "Configurações",
    href: "/admin/settings",
    iconPath: "/admin/settings.svg",
    customClass: "bg-[#CBD5E1]",
  },
];

export default function SideBar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`h-full space-y-8 ${open ? "w-64" : "w-16"} flex flex-col rounded-md border border-black bg-white p-2`}
    >
      {/*Hamburguer*/}
      <div
        className={`flex w-full flex-row items-center ${open ? "justify-start" : "justify-center"}`}
      >
        <Button
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded transition hover:bg-gray-100 hover:bg-secondary`}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? (
            <X size={24} className="text-white" />
          ) : (
            <Menu size={24} className="text-white" />
          )}
        </Button>
      </div>

      {/*Navegation*/}
      <nav className="mt-2 flex flex-col justify-center gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const baseActivateClass =
            "border rounded-md border-black shadow-gray-300 shadow-md scale-100";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-2 px-3 ${isActive ? `${baseActivateClass} ${item.customClass}` : "transition-transform hover:scale-105 hover:animate-pop"} `}
            >
              <Image
                src={item.iconPath}
                alt={item.label}
                width={20}
                height={20}
                className="transition-all duration-200"
              />
              {/* Só mostra o label quando expandido */}
              <span
                className={`font-sans-ro transition-all duration-200 ${
                  open ? "ml-2 opacity-100" : "w-0 opacity-0"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
