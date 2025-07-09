import { getSuppliers, SupplierData} from "@/api/supplier";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthContext } from "../auth/AuthContext";

interface SupplierContextType {
  suppliers: SupplierData[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  addSupplier: (supplier: SupplierData) => void;
  removeSupplier: (id: string) => void;
}

const SupplierContext = createContext<SupplierContextType>({
  suppliers: [],
  loading: false,
  error: null,
  refresh: async () => {},
  addSupplier: () => {},
  removeSupplier: () => {},
});

export function SupplierProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoading: authLoading } = useContext(AuthContext);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data || []);
    } catch (e) {
      setError(e as Error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
   if (!authLoading && user) {
      fetch();
    }
  }, [authLoading, user]);

  const addSupplier = (s: SupplierData) => {
    setSuppliers((prev) => prev ? [s, ...prev] : [s]);
  };

  const removeSupplier = (id: string) => {
    setSuppliers((prev) => prev ? prev.filter((s) => s.id !== id) : []);
  };

  return (
    <SupplierContext.Provider value={{ suppliers, loading, error, refresh: fetch, addSupplier, removeSupplier }}>
      {children}
    </SupplierContext.Provider>
  );
}

export function useSuppliers() {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error("useSuppliers must be used within a SupplierProvider");
  return ctx;
}