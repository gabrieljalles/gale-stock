import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { ProductProvider } from "./_store/products/ProductContext";
import { Toaster } from "./_components/ui/sonner";
import { AuthProvider } from "./_store/auth/AuthContext";
import ClientToaster from "./_components/ClientToaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Galé - Disk bebidas",
  description: "Created By Gabriel Jalles Ferreira Mota",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.variable} overflow-hidden`}>
        <div className="h-screen w-full bg-background">
          <AuthProvider>
            <ProductProvider>
              {children}
              <ClientToaster />
            </ProductProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
