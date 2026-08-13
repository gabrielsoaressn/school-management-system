/**
 * Dates and times.
 *
 * The database stores timestamps in UTC. Everything the school sees — "today",
 * a due date, the day of a class register — is in America/Sao_Paulo. Any code
 * that uses the server's local timezone is a bug waiting for a deploy to a
 * machine in another region.
 */

export const SCHOOL_TIME_ZONE = "America/Sao_Paulo";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SCHOOL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SCHOOL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SCHOOL_TIME_ZONE,
  month: "long",
  year: "numeric",
});

/** ISO parts of an instant as seen in São Paulo. */
function schoolParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function coerce(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return DATE_FORMATTER.format(coerce(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return DATE_TIME_FORMATTER.format(coerce(value));
}

export function formatMonthYear(value: Date | string): string {
  return MONTH_YEAR_FORMATTER.format(coerce(value));
}

/** "yyyy-MM-dd" as seen in São Paulo — the value an <input type="date"> wants. */
export function toDateInputValue(value: Date | string): string {
  const { year, month, day } = schoolParts(coerce(value));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Midnight in São Paulo for a calendar date, as a UTC instant. Use for due
 * dates and any day boundary: `new Date("2026-08-13")` is midnight *UTC*, which
 * is still 12 August in Brazil.
 */
export function schoolDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  // Sao Paulo has been at UTC-3 year round since DST ended in 2019.
  const utc = Date.UTC(year, month - 1, day, hour + 3, minute, second);
  return new Date(utc);
}

/** Parses "yyyy-MM-dd" (or an ISO string) as a calendar date in São Paulo. */
export function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return new Date(value);
  }
  return schoolDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** Start of today in São Paulo. The reference for "is it overdue?". */
export function startOfToday(now: Date = new Date()): Date {
  const { year, month, day } = schoolParts(now);
  return schoolDate(year, month, day);
}

export function endOfToday(now: Date = new Date()): Date {
  const { year, month, day } = schoolParts(now);
  return schoolDate(year, month, day, 23, 59, 59);
}

/** Current year/month in São Paulo, for payroll and billing references. */
export function currentSchoolMonth(now: Date = new Date()) {
  const { year, month } = schoolParts(now);
  return { year, month };
}

export function startOfMonth(year: number, month: number): Date {
  return schoolDate(year, month, 1);
}

export function endOfMonth(year: number, month: number): Date {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return schoolDate(year, month, lastDay, 23, 59, 59);
}

export function addMonths(date: Date, months: number): Date {
  const { year, month, day, hour, minute, second } = schoolParts(date);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();

  // Clamp: one month after 31 January is 28 February, not 3 March.
  return schoolDate(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    Math.min(day, lastDay),
    hour,
    minute,
    second
  );
}

export function addYears(date: Date, years: number): Date {
  const { year, month, day, hour, minute, second } = schoolParts(date);
  return schoolDate(year + years, month, day, hour, minute, second);
}

/** Whole days between two instants, counted by calendar date in São Paulo. */
export function daysBetween(from: Date | string, to: Date | string): number {
  const a = startOfToday(coerce(from));
  const b = startOfToday(coerce(to));
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Days a due date is past, or 0 if it is not yet due. */
export function daysOverdue(dueDate: Date | string, now: Date = new Date()): number {
  return Math.max(0, daysBetween(dueDate, startOfToday(now)));
}
