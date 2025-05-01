"use client";

import { usePathname } from "next/navigation"; // Next 13+ (App Router)
// import { useRouter } from "next/router";     // Next 12 (Pages Router)
import Link from "next/link";
import Image from "next/image";

interface NavButton {
  label: string;
  href: string;
  iconPath: string;
  customClass?: string;
}

const navItems: NavButton[] = [
  { label: "Resumo", href: "/resume", iconPath: "/admin/ShoppingMall.svg" },
  { label: "Catálogo", href: "/catalog", iconPath: "/admin/menu.svg" },
  { label: "Promoções", href: "/discount", iconPath: "/admin/Discount.svg" },
  { label: "Pedidos", href: "/orders", iconPath: "/admin/Notepad.svg" },
  { label: "Vendas", href: "/sells", iconPath: "/admin/Vector.svg" },
  {
    label: "Estoque",
    href: "/admin/stock",
    iconPath: "/admin/estoque.svg",
    customClass: "bg-[#7DF1CC]",
  },
  { label: "Usuários", href: "/users", iconPath: "/admin/User.svg" },
  { label: "Fornecedores", href: "/suppliers", iconPath: "/admin/Truck.svg" },
];

export default function SideBar() {
  const pathname = usePathname() ?? "";
  // const { pathname } = useRouter(); // se usar Pages Router

  return (
    <aside className="fixed h-screen w-64 rounded-md bg-white p-4">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const inactiveClasses = "hover:bg-gray-100";
          const baseActivateClass =
            "border rounded-md border-black shadow-gray-300 shadow-md scale-100";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 w-full flex-row items-center gap-2 overflow-hidden px-3 ${isActive ? `${baseActivateClass} ${item.customClass}` : "hover:animate-pop transition-transform"} `}
            >
              <Image
                src={item.iconPath}
                alt={item.label}
                width={20}
                height={20}
                className="transition-all duration-200"
              />
              <span className="font-sans-ro transition-all duration-200">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
