"use client";

import { useEffect, useState } from "react";
import { Power, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  getStoreStatus,
  setStoreOverride,
  updateSettings,
  StoreStatus,
} from "@/api/settings";

// "às 04:00" quando é hoje; "seg, 04:00" quando cai em outro dia — sem a
// referência do dia, "fecha às 04:00" numa loja que vira a noite fica
// ambíguo.
const formatMoment = (iso: string): string => {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${weekday}, ${time}`;
};

const StoreStatusToggle = () => {
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getStoreStatus()
      .then(setStatus)
      .catch(() => toast.error("Não foi possível carregar o status da loja."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async () => {
    if (!status || saving) return;

    const nextOpen = !status.isOpen;
    setSaving(true);
    try {
      if (status.autoScheduleEnabled) {
        // Com a grade ligada, o clique é uma intervenção por cima dela —
        // mexer no storeOpen direto seria desfeito pelo cron no minuto
        // seguinte.
        setStatus(await setStoreOverride(nextOpen ? "ForceOpen" : "ForceClose"));
        toast.success(
          nextOpen
            ? "Abertura forçada. A grade volta a mandar na próxima virada."
            : "Fechamento forçado. A grade volta a mandar na próxima virada.",
        );
      } else {
        await updateSettings({ storeOpen: nextOpen });
        await load();
        toast.success(nextOpen ? "Loja aberta para pedidos." : "Loja fechada.");
      }
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao atualizar o status da loja.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackToAuto = async () => {
    setSaving(true);
    try {
      setStatus(await setStoreOverride(null));
      toast.success("De volta ao horário automático.");
    } catch {
      toast.error("Erro ao voltar para o automático.");
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

  const isOpen = status?.isOpen ?? false;
  const override = status?.override ?? null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        title={
          status?.autoScheduleEnabled
            ? isOpen
              ? "Forçar fechamento agora"
              : "Forçar abertura agora"
            : isOpen
              ? "Clique para fechar a loja"
              : "Clique para abrir a loja"
        }
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

        {override ? (
          <>
            <p className="text-[10px] font-medium text-orange-600">
              {override === "ForceOpen" ? "Aberta" : "Fechada"} na mão
              {status?.overrideUntil
                ? ` até ${formatMoment(status.overrideUntil)}`
                : ""}
            </p>
            <button
              type="button"
              onClick={handleBackToAuto}
              disabled={saving}
              className="mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500 underline hover:text-gray-800 disabled:opacity-50"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Voltar ao automático
            </button>
          </>
        ) : (
          status?.autoScheduleEnabled &&
          status.nextTransition && (
            <p className="text-[10px] text-gray-400">
              {status.nextTransition.opens ? "Abre" : "Fecha"}{" "}
              {formatMoment(status.nextTransition.at)}
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default StoreStatusToggle;
