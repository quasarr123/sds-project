import { Elysia, t } from "elysia";
import { pool } from "../db";
import { clientIp, fail, secured } from "../plugins/auth";
import { logAudit } from "../lib/audit";
import { isValidDate, nowIST } from "../lib/time";

export function holidayRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    startDate: r.start_date,
    endDate: r.end_date,
    type: r.type,
    reason: r.reason,
    affectedVenues: r.affected_venues,
    isStrictBlock: !!r.is_strict_block,
    createdBy: r.created_by,
  };
}

/** Does a holiday's free-text "affected venues" field cover this venue? */
export function holidayCoversVenue(affected: string, venue: { name: string; type: string }): boolean {
  const text = affected.trim();
  if (/^all venues$/i.test(text)) return true;
  return text.split(",").some((raw) => {
    const part = raw.replace(/\s+only$/i, "").trim().toLowerCase();
    if (!part) return false;
    if (part === "all seminar halls") return /seminar/i.test(venue.type) || /seminar/i.test(venue.name);
    const name = venue.name.toLowerCase();
    return name.includes(part) || part.includes(name);
  });
}

export const holidayRoutes = new Elysia({ prefix: "/holidays" })
  .get(
    "/",
    secured(null, async () => {
      const [rows] = await pool.execute<any[]>("SELECT * FROM holidays ORDER BY start_date DESC");
      return rows.map(holidayRow);
    })
  )
  .post(
    "/",
    secured(["superadmin"], async (ctx, user) => {
      const b = ctx.body as any;
      if (!isValidDate(b.startDate) || !isValidDate(b.endDate)) {
        return fail(ctx, 400, "Invalid start or end date.");
      }
      if (b.startDate > b.endDate) return fail(ctx, 400, "Start date cannot occur after end date.");

      const id = `hol-${Date.now()}`;
      await pool.execute(
        `INSERT INTO holidays (id, title, start_date, end_date, type, reason, affected_venues, is_strict_block, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, b.title.trim(), b.startDate, b.endDate, b.type, b.reason.trim(), b.affectedVenues,
         b.isStrictBlock ? 1 : 0, user.name, nowIST()]
      );
      await logAudit({
        userId: user.id, actor: user.name, role: user.role, action: "BLOCKED_DATE_ADDED",
        target: b.title.trim(), ip: clientIp(ctx),
        details: `Lockout added: ${b.startDate} to ${b.endDate}. Severity: ${b.type}.`,
      });
      const [rows] = await pool.execute<any[]>("SELECT * FROM holidays WHERE id = ?", [id]);
      return holidayRow(rows[0]);
    }),
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        startDate: t.String(),
        endDate: t.String(),
        type: t.String({ maxLength: 80 }),
        reason: t.String({ minLength: 1, maxLength: 2000 }),
        affectedVenues: t.String({ maxLength: 500 }),
        isStrictBlock: t.Boolean(),
      }),
    }
  )
  .delete(
    "/:id",
    secured(["superadmin"], async (ctx, user) => {
      const [res] = await pool.execute<any>("DELETE FROM holidays WHERE id = ?", [ctx.params.id]);
      if (!res.affectedRows) return fail(ctx, 404, "Blocked date not found.");
      await logAudit({
        userId: user.id, actor: user.name, role: user.role, action: "BLOCKED_DATE_REMOVED",
        target: ctx.params.id, ip: clientIp(ctx), details: "Released university lockout window.",
      });
      return { ok: true };
    })
  );
