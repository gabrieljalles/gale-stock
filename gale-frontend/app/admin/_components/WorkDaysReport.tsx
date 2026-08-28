"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { getWorkDays, WorkDayReport } from "@/api/workDay";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDuration = (minutes: number | null): string => {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining}min`;
  return `${hours}h${remaining.toString().padStart(2, "0")}`;
};

const WorkDaysReport = () => {
  const [workDays, setWorkDays] = useState<WorkDayReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkDays()
      .then(setWorkDays)
      .catch(() => {
        toast.error("Erro ao carregar dias de trabalho.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <CalendarClock className="h-4 w-4" />
        Dias de trabalho
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
            <TableCaption className="text-xs">
              {workDays.length === 0
                ? "Nenhum dia de trabalho registrado ainda."
                : `${workDays.length} dia(s) registrado(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Abertura</TableHead>
                <TableHead className="text-xs">Fechamento</TableHead>
                <TableHead className="text-xs">Duração</TableHead>
                <TableHead className="text-xs">Pedidos</TableHead>
                <TableHead className="text-xs">Faturamento</TableHead>
                <TableHead className="text-xs">Entregas</TableHead>
                <TableHead className="text-xs">Juros</TableHead>
                <TableHead className="text-xs">Lucro</TableHead>
                <TableHead className="text-xs">Ticket médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workDays.map((wd) => (
                <TableRow key={wd.id}>
                  <TableCell className="text-xs">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        wd.isOpen
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {wd.isOpen ? "Aberto" : "Fechado"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(wd.openedAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(wd.closedAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDuration(wd.durationMinutes)}
                  </TableCell>
                  <TableCell className="text-xs">{wd.orderCount}</TableCell>
                  <TableCell className="text-xs font-semibold text-green-600">
                    {formatCurrency(wd.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-orange-600">
                    {formatCurrency(wd.totalFreightRevenue)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-purple-600">
                    {formatCurrency(wd.totalInterestReceived)}
                  </TableCell>
                  <TableCell
                    className={`text-xs font-semibold ${
                      wd.totalProfit >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(wd.totalProfit)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatCurrency(wd.averageTicket)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WorkDaysReport;
