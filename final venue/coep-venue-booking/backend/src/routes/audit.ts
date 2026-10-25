import { Elysia } from "elysia";
import { pool } from "../db";
import { secured } from "../plugins/auth";
import { auditRow } from "../lib/audit";

export const auditRoutes = new Elysia({ prefix: "/audit-logs" }).get(
  "/",
  secured(["superadmin"], async () => {
    const [rows] = await pool.execute<any[]>(
      "SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 500"
    );
    return rows.map(auditRow);
  })
);
