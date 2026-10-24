
import { Elysia } from "elysia";
import { createHash, randomBytes } from "crypto";
import { pool } from "../db";
import { config } from "../config";

export type UserRole =
  | "student"
  | "faculty"
  | "hod"
  | "superadmin";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  mis_number: string | null;
  role: UserRole;
  department_id: number | null;
}

export function sha256(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newSessionToken(): {
  raw: string;
  hash: string;
} {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: sha256(raw) };
}

export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "scoped" }, async ({ cookie, status }) => {
    const value = cookie.sid?.value;
    const raw = typeof value === "string" ? value : undefined;

    if (!raw) {
      return status(401, { message: "Not authenticated" });
    }

    const [rows] = await pool.execute(
      `SELECT
         u.id, u.name, u.email, u.mis_number,
         u.role, u.department_id, s.last_seen_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND s.expires_at > UTC_TIMESTAMP()
         AND u.is_active = TRUE
       LIMIT 1`,
      [sha256(raw)],
    );

    const row = (rows as Array<Record<string, unknown>>)[0];

    if (!row) {
      return status(401, { message: "Session expired or invalid" });
    }

    const lastSeen = row.last_seen_at;
    const lastSeenMs =
      lastSeen instanceof Date
        ? lastSeen.getTime()
        : new Date(`${String(lastSeen).replace(" ", "T")}Z`).getTime();

    const idleLimitMs = config.session.idleTimeoutMins * 60 * 1000;

    if (
      !Number.isFinite(lastSeenMs) ||
      Date.now() - lastSeenMs > idleLimitMs
    ) {
      await pool.execute(
        "DELETE FROM sessions WHERE token_hash = ?",
        [sha256(raw)],
      );

      return status(401, { message: "Session timed out" });
    }

    await pool.execute(
      "UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = ?",
      [sha256(raw)],
    );

    const user: SessionUser = {
      id: Number(row.id),
      name: String(row.name),
      email: String(row.email),
      mis_number: row.mis_number == null ? null : String(row.mis_number),
      role: row.role as UserRole,
      department_id:
        row.department_id == null ? null : Number(row.department_id),
    };

    return { user };
  });
