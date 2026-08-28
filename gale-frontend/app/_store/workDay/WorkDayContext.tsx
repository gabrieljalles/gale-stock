"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getSettings } from "@/api/settings";
import {
  getWorkDays,
  getCurrentTopProducts,
  WorkDayReport,
  TopProduct,
} from "@/api/workDay";
import { getOpenTabs, OpenTab } from "@/api/order";

interface WorkDayContextData {
  workDays: WorkDayReport[];
  topProducts: TopProduct[];
  openTabs: OpenTab[];
  storeOpen: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WorkDayContext = createContext<WorkDayContextData>(
  {} as WorkDayContextData,
);

export const WorkDayProvider = ({ children }: { children: ReactNode }) => {
  const [workDays, setWorkDays] = useState<WorkDayReport[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [settings, days, products, tabs] = await Promise.all([
        getSettings(),
        getWorkDays(),
        getCurrentTopProducts(),
        getOpenTabs(),
      ]);
      setStoreOpen(settings.storeOpen);
      setWorkDays(days);
      setTopProducts(products);
      setOpenTabs(tabs);
    } catch {
      // Silencioso: os componentes que consomem tratam a ausência de dados.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WorkDayContext.Provider
      value={{ workDays, topProducts, openTabs, storeOpen, loading, refresh }}
    >
      {children}
    </WorkDayContext.Provider>
  );
};

export const useWorkDay = () => {
  const context = useContext(WorkDayContext);
  if (!context) {
    throw new Error("useWorkDay deve ser usado dentro de WorkDayProvider");
  }
  return context;
};
