/**
 * Grade semanal de funcionamento da loja.
 *
 * A regra que sustenta tudo aqui: **a janela pertence ao dia em que
 * COMEÇA**. "Sábado, 20:00 às 04:00" é a noite de sábado entrando na
 * madrugada de domingo — não é sábado de manhã até as 4h.
 *
 * É por isso que verificar só o dia de hoje não basta: às 2h da manhã de
 * domingo, quem manda é a linha de SÁBADO. Ignorar isso é o jeito clássico
 * de a loja fechar sozinha na virada da meia-noite, no meio do movimento.
 */

export interface DaySchedule {
  /** 0 = domingo ... 6 = sábado (mesma convenção de Date.getDay()). */
  weekday: number;
  isOpen: boolean;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

const MINUTES_IN_DAY = 24 * 60;

const toMinutes = (hour: number, minute: number): number => hour * 60 + minute;

const minutesOfDay = (date: Date): number =>
  date.getHours() * 60 + date.getMinutes();

const scheduleFor = (
  schedules: DaySchedule[],
  weekday: number,
): DaySchedule | undefined => schedules.find((s) => s.weekday === weekday);

/**
 * Duração da janela em minutos.
 *
 * Horários iguais significam 24 horas — é a convenção que as pessoas
 * esperam ("aberto 24h"), e evita que 00:00→00:00 vire um dia fechado.
 */
const windowLength = (schedule: DaySchedule): number => {
  const open = toMinutes(schedule.openHour, schedule.openMinute);
  const close = toMinutes(schedule.closeHour, schedule.closeMinute);

  if (close === open) return MINUTES_IN_DAY;
  if (close > open) return close - open;
  return MINUTES_IN_DAY - open + close; // cruza a meia-noite
};

/** A loja está aberta neste instante, segundo a grade? */
export function isOpenBySchedule(
  schedules: DaySchedule[],
  date: Date = new Date(),
): boolean {
  const now = minutesOfDay(date);
  const weekday = date.getDay();

  // Janela que começou hoje.
  const today = scheduleFor(schedules, weekday);
  if (today?.isOpen) {
    const open = toMinutes(today.openHour, today.openMinute);
    const end = open + windowLength(today);
    if (now >= open && now < end) return true;
  }

  // Sobra da véspera que passou da meia-noite. Sem isto, uma janela
  // 20:00→04:00 morreria às 23:59.
  const yesterday = scheduleFor(schedules, (weekday + 6) % 7);
  if (yesterday?.isOpen) {
    const open = toMinutes(yesterday.openHour, yesterday.openMinute);
    const end = open + windowLength(yesterday);
    // Só interessa o pedaço que invadiu o dia de hoje.
    if (end > MINUTES_IN_DAY && now < end - MINUTES_IN_DAY) return true;
  }

  return false;
}

export interface Transition {
  at: Date;
  /** true = a loja abre nesse instante; false = fecha. */
  opens: boolean;
}

/**
 * Próxima virada da grade depois de `from`.
 *
 * Serve para dois usos: mostrar "fecha às HH:MM" na vitrine e decidir até
 * quando uma intervenção manual vale. Varre 8 dias para frente — o
 * suficiente para achar alguma virada mesmo numa grade com um único dia
 * aberto na semana.
 */
export function nextTransition(
  schedules: DaySchedule[],
  from: Date = new Date(),
): Transition | null {
  const boundaries: Transition[] = [];

  for (let offset = -1; offset <= 8; offset += 1) {
    const day = new Date(from);
    day.setDate(day.getDate() + offset);
    day.setHours(0, 0, 0, 0);

    const schedule = scheduleFor(schedules, day.getDay());
    if (!schedule?.isOpen) continue;

    const opensAt = new Date(day);
    opensAt.setMinutes(toMinutes(schedule.openHour, schedule.openMinute));

    const closesAt = new Date(opensAt);
    closesAt.setMinutes(closesAt.getMinutes() + windowLength(schedule));

    boundaries.push({ at: opensAt, opens: true });
    boundaries.push({ at: closesAt, opens: false });
  }

  return (
    boundaries
      .filter((boundary) => boundary.at.getTime() > from.getTime())
      .sort((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null
  );
}

/** "HH:MM" para exibição. */
export const formatTime = (hour: number, minute: number): string =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
