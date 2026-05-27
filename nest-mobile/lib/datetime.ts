/**
 * Helpers de fecha y hora basados en Intl (sin dependencias).
 * Toda la lógica de TZ es a través de Intl.DateTimeFormat.
 */

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const DAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Devuelve YYYY-MM-DD en un timezone dado para una fecha. */
export function formatDateKey(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date); // en-CA → YYYY-MM-DD
}

/** Hora "HH:mm" de una fecha en un TZ dado. */
export function formatTime(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('es-MX', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return fmt.format(date);
}

/** "HH:mm" formato 12h con am/pm para mostrar al usuario. */
export function formatTime12h(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('es-MX', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return fmt.format(date).toLowerCase();
}

/** "lun 27 may" (corto, en español). */
export function formatShortDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  // Simplificación a español:
  const dayNum = get('day');
  const month = get('month').toLowerCase().replace('.', '');
  const weekdayIndex = getWeekdayIndex(date, timezone);
  return `${DAY_LABELS_ES[weekdayIndex]} ${dayNum} ${month}`;
}

/** Día de la semana 0..6 (0=domingo) según el TZ. */
export function getWeekdayIndex(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[fmt.format(date)] ?? 0;
}

/** "Hoy", "Mañana", o "Mié 28" para distancia ≤6 días. */
export function formatRelativeDay(
  date: Date,
  timezone: string,
  now: Date = new Date(),
): string {
  const todayKey = formatDateKey(now, timezone);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const tomorrowKey = formatDateKey(tomorrow, timezone);
  const targetKey = formatDateKey(date, timezone);

  if (targetKey === todayKey) return 'Hoy';
  if (targetKey === tomorrowKey) return 'Mañana';
  return formatShortDate(date, timezone);
}

/** "lun 27 may, 18:30" combinado (24h o 12h según el flag). */
export function formatDateTime(
  date: Date,
  timezone: string,
  opts?: { use12h?: boolean },
): string {
  const dayLabel = formatRelativeDay(date, timezone);
  const time = opts?.use12h
    ? formatTime12h(date, timezone)
    : formatTime(date, timezone);
  return `${dayLabel}, ${time}`;
}

/** "18:30 – 19:30" rango horario en el mismo día. */
export function formatTimeRange(
  startISO: string,
  endISO: string,
  timezone: string,
): string {
  return `${formatTime(new Date(startISO), timezone)} – ${formatTime(new Date(endISO), timezone)}`;
}

/** "Mes Año" largo, p.ej. "Mayo 2026". */
export function formatMonthYear(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const monthIdx = parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10) - 1;
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${MONTH_LABELS_ES[monthIdx] ?? ''} ${year}`;
}

/**
 * Suma `days` días a una fecha y devuelve el YYYY-MM-DD resultante en el TZ del usuario.
 * Útil para construir el strip de días.
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Texto humano "en 15 min" o "hace 2 h". */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const min = Math.round(absMs / 60_000);
  const hr = Math.round(absMs / 3_600_000);
  const day = Math.round(absMs / 86_400_000);

  const future = diffMs > 0;
  if (min < 1) return 'ahora';
  if (min < 60) return future ? `en ${min} min` : `hace ${min} min`;
  if (hr < 24) return future ? `en ${hr} h` : `hace ${hr} h`;
  return future ? `en ${day} d` : `hace ${day} d`;
}
