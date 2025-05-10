import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { useState } from "react";
import { Menu, SquareMenu } from "lucide-react";

const navItems = [
  { label: "Loja", href: "/" },
  { label: "Sobre", href: "/sobre" },
];

const HeaderComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="fixed top-0 flex h-[70px] w-full bg-background">
      <div className="max-w-1440 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full flex-row items-center justify-between space-x-48">
          {/* Logo image */}
          <Link
            href="/"
            className="flex h-full flex-none items-center justify-center transition-transform duration-300 hover:animate-float"
          >
            <Image
              src="/light-logo-noname.png"
              alt="Logo da Loja (versão clara)"
              width={50}
              height={50}
              className="block dark:hidden"
            />
            <Image
              src="/dark-logo-noname.png"
              alt="Logo da Loja (versão escura)"
              width={50}
              height={50}
              className="hidden dark:block"
            />
          </Link>

          {/* Navigation links */}
          <div className="ml-auto hidden flex-1 items-center justify-end md:flex md:w-[600px] md:space-x-6 lg:w-[900px]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg transition-colors hover:animate-pop hover:text-secondary"
              >
                {item.label}
              </Link>
            ))}

            <Button className="border-2 border-primary bg-transparent transition-colors hover:border-secondary hover:text-secondary">
              <Link href="/login">Faça seu pedido</Link>
            </Button>
            <Button className="w-40 bg-primary font-semibold text-background transition-colors duration-500 hover:bg-secondary hover:text-primary">
              <Link href="/cadastro">Cadastrar</Link>
            </Button>
          </div>

          {/* Botão Hamburger (sm) */}
          <div className="items-end justify-end sm:w-[200px] md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <SquareMenu className="h-12 w-12" />
              ) : (
                <Menu className="h-12 w-12" />
              )}
            </button>
          </div>

          {/* Menu Vertical (sm) */}
          {isOpen && (
            <div className="bg-background text-primary md:hidden"></div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
