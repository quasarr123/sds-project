import { pool } from "../db";

export const DEFAULT_SETTINGS = {
  minLeadTimeDays: 3,
  maxAdvanceDays: 60,
  allowWeekendBooking: true,
  autoEscalateHours: 48,
  dailyClosingTime: "21:30",
  dailyOpeningTime: "07:30",
  autoNotifyEmail: true,
  autoNotifySMS: true,
  requireFacultyEndorsementForStudents: true,
  requireHODApprovalForDeptVenues: true,
  maxConcurrentBookingsPerClub: 2,
  gracePeriodMinutesForCancellation: 24,
  maintenanceWindowHoursWeekly: 8,
  termsAndConditions:
    "All student clubs must adhere to COEP sound limits (below 65dB post 8 PM) and vacate venues within 30 minutes of reservation expiration. Alcohol, tobacco, or hazardous pyrotechnics are strictly banned under Maharashtra University Act.",
};

export type Settings = typeof DEFAULT_SETTINGS;

export async function loadSettings(): Promise<Settings> {
  const [rows] = await pool.execute<any[]>("SELECT data FROM settings WHERE id = 1");
  if (!rows[0]) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(rows[0].data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Keeps only known keys and coerces each to the type of its default. */
export function sanitizeSettings(input: Record<string, unknown>): Settings {
  const out: any = { ...DEFAULT_SETTINGS };
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in input)) continue;
    const v = (input as any)[key];
    if (typeof def === "number") {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) out[key] = n;
    } else if (typeof def === "boolean") {
      out[key] = v === true || v === "true";
    } else if (typeof def === "string") {
      out[key] = String(v).slice(0, 5000);
    }
  }
  return out as Settings;
}
