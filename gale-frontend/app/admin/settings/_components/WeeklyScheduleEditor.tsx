"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Button } from "@/_components/ui/button";
import {
  DaySchedule,
  WEEKDAY_LABELS,
  formatScheduleTime,
  getSchedules,
  updateSchedules,
} from "@/api/settings";

const parseTime = (value: string): { hour: number; minute: number } | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
};

// Uma janela cruza a meia-noite quando o fechamento é "antes" da abertura.
const crossesMidnight = (day: DaySchedule): boolean =>
  day.closeHour * 60 + day.closeMinute < day.openHour * 60 + day.openMinute;

const isFullDay = (day: DaySchedule): boolean =>
  day.closeHour === day.openHour && day.closeMinute === day.openMinute;

interface WeeklyScheduleEditorProps {
  /** Sem automação a grade fica visível, mas inerte. */
  enabled: boolean;
}

const WeeklyScheduleEditor = ({ enabled }: WeeklyScheduleEditorProps) => {
  const [days, setDays] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSchedules()
      .then(setDays)
      .catch(() => toast.error("Erro ao carregar os horários."))
      .finally(() => setLoading(false));
  }, []);

  const patchDay = (weekday: number, patch: Partial<DaySchedule>) =>
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    );

  const handleTimeChange = (
    weekday: number,
    field: "open" | "close",
    value: string,
  ) => {
    const parsed = parseTime(value);
    if (!parsed) return;

    patchDay(
      weekday,
      field === "open"
        ? { openHour: parsed.hour, openMinute: parsed.minute }
        : { closeHour: parsed.hour, closeMinute: parsed.minute },
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setDays(await updateSchedules(days));
      toast.success("Horários salvos!");
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao salvar os horários.");
    } finally {
      setSaving(false);
    }
  };

  /** Copia o primeiro dia aberto para todos os outros dias abertos. */
  const handleApplyToAll = () => {
    const source = days.find((day) => day.isOpen);
    if (!source) return;

    setDays((current) =>
      current.map((day) =>
        day.isOpen
          ? {
              ...day,
              openHour: source.openHour,
              openMinute: source.openMinute,
              closeHour: source.closeHour,
              closeMinute: source.closeMinute,
            }
          : day,
      ),
    );
    toast.success(
      `Horário de ${WEEKDAY_LABELS[source.weekday]} aplicado aos dias abertos.`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando horários...
      </div>
    );
  }

  return (
    <fieldset disabled={!enabled} className="space-y-2 disabled:opacity-50">
      {days.map((day) => (
        <div
          key={day.weekday}
          className="flex flex-wrap items-center gap-2 rounded-md border p-2"
        >
          <label className="flex w-28 flex-shrink-0 items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={day.isOpen}
              onChange={(event) =>
                patchDay(day.weekday, { isOpen: event.target.checked })
              }
              className="h-4 w-4"
            />
            {WEEKDAY_LABELS[day.weekday]}
          </label>

          {day.isOpen ? (
            <>
              <input
                type="time"
                value={formatScheduleTime(day.openHour, day.openMinute)}
                onChange={(event) =>
                  handleTimeChange(day.weekday, "open", event.target.value)
                }
                className="rounded-md border px-2 py-1 text-sm"
              />
              <span className="text-xs text-gray-400">às</span>
              <input
                type="time"
                value={formatScheduleTime(day.closeHour, day.closeMinute)}
                onChange={(event) =>
                  handleTimeChange(day.weekday, "close", event.target.value)
                }
                className="rounded-md border px-2 py-1 text-sm"
              />

              {isFullDay(day) ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  24 horas
                </span>
              ) : (
                crossesMidnight(day) && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                    vira a madrugada
                  </span>
                )
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400">Fechado o dia todo</span>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleApplyToAll}
        >
          Repetir em todos os dias abertos
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={handleSave}
          className="bg-black text-white hover:bg-green-600"
        >
          {saving ? "Salvando..." : "Salvar horários"}
        </Button>
      </div>

      <p className="text-xs text-gray-400">
        Fechar antes de abrir significa que a janela vira a madrugada: 20:00
        às 04:00 é a noite desse dia entrando no dia seguinte. Horários
        iguais valem como 24 horas.
      </p>
    </fieldset>
  );
};

export default WeeklyScheduleEditor;
