import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/api/supplier";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthContext } from "../auth/AuthContext";
import { SupplierProps } from "@/_types";

interface SupplierContextType {
  suppliers: SupplierProps[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  addSupplier: (supplier: Omit<SupplierProps, "id">) => Promise<SupplierProps>;
  updateSupplier: (id: string, supplier: Omit<SupplierProps, "id">) => Promise<SupplierProps>;
  removeSupplier: (id: string) => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType>({
  suppliers: [],
  loading: false,
  error: null,
  refresh: async () => {},
  addSupplier: async () => ({}) as SupplierProps,
  updateSupplier: async () => ({}) as SupplierProps,
  removeSupplier: async () => {},
});

export function SupplierProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<SupplierProps[]>([]);
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

  const addSupplier = async (supplierData: Omit<SupplierProps, "id">) => {
    try {
      const newSupplier = await createSupplier(supplierData);
      setSuppliers((prev) => [newSupplier, ...prev]);
      return newSupplier;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const updateSupplierFunc = async (id: string, supplierData: Omit<SupplierProps, "id">) => {
    try {
      const updatedSupplier = await updateSupplier(id, supplierData);
      setSuppliers((prev) => 
        prev.map((s) => (s.id === id ? updatedSupplier : s))
      );
      return updatedSupplier;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const removeSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return (
    <SupplierContext.Provider
      value={{
        suppliers,
        loading,
        error,
        refresh: fetch,
        addSupplier,
        updateSupplier: updateSupplierFunc,
        removeSupplier,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSuppliers() {
  const ctx = useContext(SupplierContext);
  if (!ctx)
    throw new Error("useSuppliers must be used within a SupplierProvider");
  return ctx;
}
