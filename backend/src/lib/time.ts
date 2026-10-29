// Dates are stored/compared in IST (Asia/Kolkata) because that is the campus clock.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

function istParts(d = new Date()) {
  const t = new Date(d.getTime() + IST_OFFSET_MS);
  return {
    y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(),
    h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds(),
  };
}

/** 'YYYY-MM-DD HH:MM:SS' in IST (for DATETIME columns). */
export function nowIST(): string {
  const p = istParts();
  return `${p.y}-${pad(p.mo)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`;
}

export function todayIST(): string {
  return nowIST().slice(0, 10);
}

export function currentYearIST(): number {
  return istParts().y;
}

/** 'YYYY-MM-DD hh:mm AM' for display, from a 'YYYY-MM-DD HH:MM:SS' string. */
export function fmtDisplay(dt: string | null | undefined): string | undefined {
  if (!dt) return undefined;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(dt);
  if (!m) return dt;
  let h = Number(m[2]);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${m[1]} ${pad(h)}:${m[3]} ${ap}`;
}

export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function daysBetween(fromDate: string, toDate: string): number {
  return Math.round(
    (Date.parse(toDate + "T00:00:00Z") - Date.parse(fromDate + "T00:00:00Z")) / 86400000
  );
}

export function isWeekend(date: string): boolean {
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  return dow === 0 || dow === 6;
}

/** A time range as minutes since midnight. `end` is exclusive, so 3-4 PM and 4-5 PM do not overlap. */
export interface Interval { start: number; end: number }

/** Parses '09:00 AM - 01:00 PM (Morning Slot)' -> minutes since midnight. */
export function parseSlot(slot: string): Interval | null {
  const times = [...slot.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  if (times.length < 2) return null;
  const toMin = (m: RegExpMatchArray) => {
    let h = Number(m[1]) % 12;
    if (m[3]!.toUpperCase() === "PM") h += 12;
    return h * 60 + Number(m[2]);
  };
  const start = toMin(times[0]!);
  const end = toMin(times[1]!);
  return end > start ? { start, end } : null;
}

/** Minutes since midnight -> 'HH:MM:00' (MySQL TIME). */
export function minutesToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}:00`;
}

/** 'HH:MM' or 'HH:MM:SS' -> minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/** 930 -> '3:30 PM'. */
export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(min % 60)} ${h >= 12 ? "PM" : "AM"}`;
}

/** '3:30 PM – 4:00 PM' */
export function fmtRange({ start, end }: Interval): string {
  return `${fmtMinutes(start)} – ${fmtMinutes(end)}`;
}

export function hhmmToMinutes(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
