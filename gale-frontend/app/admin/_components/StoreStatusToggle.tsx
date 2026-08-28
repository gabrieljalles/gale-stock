"use client";

import { useEffect, useState } from "react";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSettings, SiteSettings } from "@/api/settings";
import { isAxiosError } from "axios";

const StoreStatusToggle = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {
        toast.error("Não foi possível carregar o status da loja.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    if (!settings || saving) return;

    const nextStoreOpen = !settings.storeOpen;
    setSaving(true);
    try {
      const updated = await updateSettings({ storeOpen: nextStoreOpen });
      setSettings(updated);
      toast.success(
        nextStoreOpen ? "Loja aberta para pedidos." : "Loja fechada.",
      );
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao atualizar o status da loja.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
        <span className="text-xs text-gray-400">Carregando...</span>
      </div>
    );
  }

  const isOpen = settings?.storeOpen ?? false;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        title={isOpen ? "Clique para fechar a loja" : "Clique para abrir a loja"}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
          isOpen
            ? "animate-glowPulse border-green-500 bg-gradient-to-b from-green-400 to-green-600"
            : "border-gray-300 bg-gradient-to-b from-gray-300 to-gray-400 shadow-inner"
        }`}
      >
        <Power
          className={`h-8 w-8 ${isOpen ? "text-white" : "text-gray-100"}`}
          strokeWidth={2.5}
        />
      </button>
      <div className="text-center">
        <p
          className={`text-sm font-semibold ${
            isOpen ? "text-green-600" : "text-gray-500"
          }`}
        >
          {isOpen ? "Loja aberta" : "Loja fechada"}
        </p>
        {settings?.autoCloseEnabled && (
          <p className="text-[10px] text-gray-400">
            Fecha automaticamente às {settings.storeCloseHour}h
          </p>
        )}
      </div>
    </div>
  );
};

export default StoreStatusToggle;
