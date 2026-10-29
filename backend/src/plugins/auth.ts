import { createHash, randomBytes } from "crypto";
import { pool } from "../db";
import { config } from "../config";

export type UserRole = "student" | "faculty" | "hod" | "superadmin";

/** Shape sent to the frontend (matches what the React app expects). */
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  mis_number: string | null;
  mis: string | null;
  role: UserRole;
  department_id: number | null;
  department: string;
  designation: string;
  avatar: string;
}

export function sha256(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: sha256(raw) };
}

const TITLES = /^(dr|prof|col|mr|mrs|ms|retd)\.?$/i;
export function initials(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, " ")
    .split(/\s+/)
    .filter((w) => w && !TITLES.test(w));
  const letters = words.map((w) => w[0]!.toUpperCase()).join("");
  return (letters.length > 2 ? letters[0]! + letters[letters.length - 1]! : letters) || "CP";
}

const DEFAULT_DESIGNATION: Record<UserRole, string> = {
  student: "B.Tech Student",
  faculty: "Faculty Coordinator",
  hod: "Head of Department",
  superadmin: "Superadmin / Registrar",
};

export function toSessionUser(row: any): SessionUser {
  const role = row.role as UserRole;
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    mis_number: row.mis_number ?? null,
    mis: row.mis_number ?? null,
    role,
    department_id: row.department_id == null ? null : Number(row.department_id),
    department: row.department_name ?? "",
    designation: row.designation || DEFAULT_DESIGNATION[role],
    avatar: initials(row.name),
  };
}

export const USER_SELECT = `
  u.id, u.name, u.email, u.mis_number, u.role, u.department_id, u.designation,
  d.name AS department_name`;

export function clientIp(ctx: any): string {
  const fwd = ctx.request?.headers?.get?.("x-forwarded-for");
  if (fwd) return String(fwd).split(",")[0]!.trim();
  const direct = ctx.server?.requestIP?.(ctx.request)?.address;
  return direct ?? "unknown";
}

export function fail(ctx: any, code: number, message: string) {
  ctx.set.status = code;
  return { message };
}

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; code: number; message: string };

/** Validates the session cookie, enforces expiry + idle timeout, touches last_seen_at. */
export async function authenticate(cookie: any): Promise<AuthResult> {
  const rawVal = cookie?.sid?.value;
  const raw = typeof rawVal === "string" ? rawVal : undefined;
  if (!raw) return { ok: false, code: 401, message: "Not authenticated" };

  const hash = sha256(raw);
  const [rows] = await pool.execute<any[]>(
    `SELECT ${USER_SELECT}, s.last_seen_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
  LEFT JOIN departments d ON d.id = u.department_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.is_active = 1
      LIMIT 1`,
    [hash]
  );
  const row = rows[0];
  if (!row) return { ok: false, code: 401, message: "Session expired or invalid" };

  const lastSeen = new Date(String(row.last_seen_at).replace(" ", "T") + "Z").getTime();
  if (!Number.isFinite(lastSeen) || Date.now() - lastSeen > config.session.idleTimeoutMins * 60_000) {
    await pool.execute("DELETE FROM sessions WHERE token_hash = ?", [hash]);
    return { ok: false, code: 401, message: "Session timed out due to inactivity" };
  }

  await pool.execute("UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = ?", [hash]);
  return { ok: true, user: toSessionUser(row) };
}

/**
 * Wraps a route handler with authentication (+ optional role check).
 *   .get("/x", secured(null, async (ctx, user) => ...))            any logged-in user
 *   .post("/y", secured(["superadmin"], async (ctx, user) => ...)) role-restricted
 */
export function secured<T>(
  roles: UserRole[] | null,
  fn: (ctx: any, user: SessionUser) => Promise<T> | T
) {
  return async (ctx: any) => {
    const auth = await authenticate(ctx.cookie);
    if (!auth.ok) return fail(ctx, auth.code, auth.message);
    if (roles && !roles.includes(auth.user.role)) {
      return fail(ctx, 403, "Forbidden: insufficient permissions");
    }
    return fn(ctx, auth.user);
  };
}
