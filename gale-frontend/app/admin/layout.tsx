"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/_store/auth/AuthContext";
import { SupplierProvider } from "@/_store/supplier/SupplierContext";
import Loading from "@/_components/loadingComponent";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user && !isLoading) {
      router.replace("/login");
    }
    if (!isLoading && (!user || !["Admin", "Shopper"].includes(user.role))) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <Loading />;

  return <SupplierProvider>{children}</SupplierProvider>;
}
