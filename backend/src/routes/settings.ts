import { Elysia, t } from "elysia";
import { pool } from "../db";
import { clientIp, secured } from "../plugins/auth";
import { logAudit } from "../lib/audit";
import { loadSettings, sanitizeSettings } from "../lib/settings";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .get("/", secured(null, () => loadSettings()))
  .put(
    "/",
    secured(["superadmin"], async (ctx, user) => {
      const clean = sanitizeSettings(ctx.body as Record<string, unknown>);
      await pool.execute(
        `INSERT INTO settings (id, data) VALUES (1, ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data)`,
        [JSON.stringify(clean)]
      );
      await logAudit({
        userId: user.id, actor: user.name, role: user.role, action: "SETTINGS_UPDATED",
        target: "Global Booking Settings", ip: clientIp(ctx),
        details: `Lead time set to ${clean.minLeadTimeDays} days, auto-escalation: ${clean.autoEscalateHours} hrs.`,
      });
      return clean;
    }),
    { body: t.Record(t.String(), t.Any()) }
  );
