import type { Executor } from "../db";
import { pool } from "../db";
import { nowIST } from "./time";

export interface AuditEntry {
  userId?: number | null;
  actor: string;
  role: string;
  action: string;
  target: string;
  ip?: string;
  status?: "SUCCESS" | "WARNING" | "FAILED";
  details?: string;
}

export async function logAudit(entry: AuditEntry, db: Executor = pool): Promise<void> {
  try {
    await (db as any).execute(
      `INSERT INTO audit_logs (user_id, actor, role, action, target, ip_address, status, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.userId ?? null, entry.actor, entry.role, entry.action, entry.target,
        entry.ip ?? null, entry.status ?? "SUCCESS", entry.details ?? null, nowIST(),
      ]
    );
  } catch (e) {
    // Never let an audit failure break the user's request.
    console.error("audit log failed:", e);
  }
}

export function auditRow(r: any) {
  return {
    id: `LOG-${r.id}`,
    timestamp: r.created_at,
    actor: r.actor,
    role: r.role,
    action: r.action,
    target: r.target,
    ipAddress: r.ip_address ?? "unknown",
    status: r.status,
    details: r.details ?? "",
  };
}
