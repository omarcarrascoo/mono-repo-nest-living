/**
 * Helpers TZ-aware sin dependencias externas.
 * Usamos `Intl.DateTimeFormat` que ya viene en Node 22 con full ICU.
 */

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

const SHORT_TO_KEY: Record<string, DayKey> = {
  sun: 'sun',
  mon: 'mon',
  tue: 'tue',
  wed: 'wed',
  thu: 'thu',
  fri: 'fri',
  sat: 'sat',
};

export function parseHHmm(s: string): { hours: number; minutes: number } {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  return { hours: h, minutes: m };
}

/**
 * "Wall clock" de un instante UTC en una timezone dada.
 * Devuelve `'YYYY-MM-DDTHH:mm:ss'` (sin offset, sin Z).
 */
function wallClockOf(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * Convierte un timestamp "local" (`'YYYY-MM-DDTHH:mm:ss'` en `timezone`) a un Date UTC.
 *
 * Algoritmo:
 *  1. Tratamos el localISO como si fuera UTC (`desiredUtc`) → un instante de prueba.
 *  2. Le preguntamos a Intl qué hora marca ese instante en `timezone` (`wall`).
 *  3. La diferencia (`desiredUtc - wall`) es exactamente el offset de la zona en
 *     esa fecha (ya considera DST porque le dimos una fecha concreta).
 *  4. Sumamos el offset al instante de prueba → UTC real.
 */
export function zonedTimeToUtc(localISO: string, timezone: string): Date {
  const desiredUtc = new Date(localISO + 'Z');
  const wall = wallClockOf(desiredUtc, timezone);
  const wallAsUtc = new Date(wall + 'Z');
  const offsetMs = desiredUtc.getTime() - wallAsUtc.getTime();
  return new Date(desiredUtc.getTime() + offsetMs);
}

/**
 * Devuelve qué día de la semana corresponde a una fecha `YYYY-MM-DD`
 * interpretada en `timezone`. Usamos las 12:00 locales como referencia para
 * evitar ambigüedad por DST.
 */
export function dayKeyForDateInTz(dateStr: string, timezone: string): DayKey {
  const utc = zonedTimeToUtc(`${dateStr}T12:00:00`, timezone);
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  })
    .format(utc)
    .toLowerCase()
    .slice(0, 3);
  return SHORT_TO_KEY[wd] ?? 'mon';
}

/**
 * Devuelve `Date` UTC para una fecha local + hora `HH:mm` en `timezone`.
 */
export function combineDateAndTimeInTz(
  dateStr: string,
  hhmm: string,
  timezone: string,
): Date {
  return zonedTimeToUtc(`${dateStr}T${hhmm}:00`, timezone);
}
