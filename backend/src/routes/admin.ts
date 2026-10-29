/** Superadmin-only management of users, venues and clubs. */
import { Elysia, t } from "elysia";
import { pool } from "../db";
import { clientIp, fail, secured } from "../plugins/auth";
import { logAudit } from "../lib/audit";
import { config } from "../config";
import { venueRow } from "./venues";
import { clubRow } from "./clubs";

const ROLES = ["student", "faculty", "hod", "superadmin"];
const CATEGORIES = ["department", "central", "club"];
const dup = (e: any) => e?.errno === 1062;

function userRow(r: any) {
  return {
    id: Number(r.id), name: r.name, email: r.email, misNumber: r.mis_number, role: r.role,
    departmentId: r.department_id == null ? null : Number(r.department_id),
    department: r.department_name ?? "", designation: r.designation ?? "", isActive: !!r.is_active,
  };
}
const USER_SQL = `SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON d.id = u.department_id`;

export const adminRoutes = new Elysia({ prefix: "/admin" })

  // ── Users ──
  .get("/users", secured(["superadmin"], async () => {
    const [rows] = await pool.execute<any[]>(`${USER_SQL} ORDER BY u.role, u.name`);
    return rows.map(userRow);
  }))
  .post("/users", secured(["superadmin"], async (ctx, me) => {
    const b = ctx.body as any;
    if (!ROLES.includes(b.role)) return fail(ctx, 400, "Invalid role.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) return fail(ctx, 400, "Enter a valid email address.");
        const hodEmail = String(b.email).trim().toLowerCase();
    if (!hodEmail.endsWith("@coep.ac.in") && !hodEmail.endsWith("@coeptech.ac.in"))
      return fail(ctx, 400, "Use a COEP email ending in @coep.ac.in or @coeptech.ac.in.");
    if (b.password !== undefined && b.password.length < 8)
      return fail(ctx, 400, "Password must be at least 8 characters long.");
    if (b.role === "hod") {
      if (!b.departmentId) return fail(ctx, 400, "An HOD must be assigned to a department.");
      const [dep] = await pool.execute<any[]>("SELECT id FROM departments WHERE id = ?", [b.departmentId]);
      if (!dep[0]) return fail(ctx, 400, "That department does not exist.");
    }
    const hash = await Bun.password.hash(b.password || config.demoPassword);
    try {
      const [res] = await pool.execute<any>(
        `INSERT INTO users (name, email, mis_number, password_hash, role, department_id, designation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [b.name.trim(), b.email.trim().toLowerCase(), b.misNumber || null, hash, b.role, b.departmentId ?? null, b.designation || null]
      );
      await logAudit({ userId: me.id, actor: me.name, role: me.role, action: "USER_CREATED",
        target: `${b.email} (${b.role})`, ip: clientIp(ctx) });
      const [rows] = await pool.execute<any[]>(`${USER_SQL} WHERE u.id = ?`, [res.insertId]);
      return userRow(rows[0]);
    } catch (e: any) {
      if (dup(e)) return fail(ctx, 409, "A user with this email or MIS number already exists.");
      throw e;
    }
  }), { body: t.Object({
    name: t.String({ minLength: 1, maxLength: 120 }), email: t.String({ maxLength: 190 }),
    misNumber: t.Optional(t.Union([t.String({ maxLength: 20 }), t.Null()])), role: t.String(),
    departmentId: t.Optional(t.Union([t.Number(), t.Null()])), designation: t.Optional(t.Union([t.String({ maxLength: 160 }), t.Null()])),
    password: t.Optional(t.String({ maxLength: 255 })) }) })
  .put("/users/:id", secured(["superadmin"], async (ctx, me) => {
    const id = Number(ctx.params.id);
    const b = ctx.body as any;
    if (b.role !== undefined && !ROLES.includes(b.role)) return fail(ctx, 400, "Invalid role.");
    if (id === me.id && (b.isActive === false || (b.role && b.role !== "superadmin"))) {
      return fail(ctx, 400, "You cannot deactivate or demote your own account.");
    }
    const sets: string[] = []; const vals: any[] = [];
    const add = (col: string, v: any) => { sets.push(`${col} = ?`); vals.push(v); };
    if (b.name !== undefined) add("name", b.name.trim());
    if (b.role !== undefined) add("role", b.role);
    if (b.departmentId !== undefined) add("department_id", b.departmentId);
    if (b.designation !== undefined) add("designation", b.designation || null);
    if (b.isActive !== undefined) add("is_active", b.isActive ? 1 : 0);
    if (b.password) add("password_hash", await Bun.password.hash(b.password));
    if (!sets.length) return fail(ctx, 400, "Nothing to update.");
    const [res] = await pool.execute<any>(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);
    if (!res.affectedRows) return fail(ctx, 404, "User not found.");
    if (b.isActive === false || b.password) await pool.execute("DELETE FROM sessions WHERE user_id = ?", [id]);
    await logAudit({ userId: me.id, actor: me.name, role: me.role, action: "USER_UPDATED",
      target: `user #${id}`, ip: clientIp(ctx), details: `Fields: ${Object.keys(b).join(", ")}` });
    const [rows] = await pool.execute<any[]>(`${USER_SQL} WHERE u.id = ?`, [id]);
    return userRow(rows[0]);
  }), { body: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 120 })), role: t.Optional(t.String()),
    departmentId: t.Optional(t.Union([t.Number(), t.Null()])), designation: t.Optional(t.Union([t.String({ maxLength: 160 }), t.Null()])),
    isActive: t.Optional(t.Boolean()), password: t.Optional(t.String({ maxLength: 255 })) }) })

  // ── Venues ──
  .post("/venues", secured(["superadmin"], async (ctx, me) => {
    const b = ctx.body as any;
    if (!CATEGORIES.includes(b.category)) return fail(ctx, 400, "Category must be department, central or club.");
    const id = `v-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)}-${Date.now().toString(36).slice(-4)}`;
    await pool.execute(
      `INSERT INTO venues (id, name, location, capacity, type, amenities, department, is_air_conditioned, status, image, hourly_rate, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, b.name.trim(), b.location, b.capacity, b.type, JSON.stringify(b.amenities ?? []), b.department,
       b.isAirConditioned ? 1 : 0, b.status ?? "Available", b.image ?? null, b.hourlyRate ?? "Free for Academic", b.category]
    );
    await logAudit({ userId: me.id, actor: me.name, role: me.role, action: "VENUE_CREATED", target: b.name, ip: clientIp(ctx) });
    const [rows] = await pool.execute<any[]>("SELECT * FROM venues WHERE id = ?", [id]);
    return venueRow(rows[0]);
  }), { body: t.Object({
    name: t.String({ minLength: 1, maxLength: 160 }), location: t.String({ maxLength: 255 }), capacity: t.Number({ minimum: 1 }),
    type: t.String({ maxLength: 80 }), amenities: t.Optional(t.Array(t.String())), department: t.String({ maxLength: 120 }),
    category: t.String(), isAirConditioned: t.Optional(t.Boolean()), status: t.Optional(t.String({ maxLength: 30 })),
    image: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])), hourlyRate: t.Optional(t.String({ maxLength: 80 })) }) })
  .put("/venues/:id", secured(["superadmin"], async (ctx, me) => {
    const b = ctx.body as any;
    if (b.category !== undefined && !CATEGORIES.includes(b.category)) return fail(ctx, 400, "Category must be department, central or club.");
    const map: Record<string, string> = { name: "name", location: "location", capacity: "capacity", type: "type",
      department: "department", category: "category", status: "status", image: "image", hourlyRate: "hourly_rate" };
    const sets: string[] = []; const vals: any[] = [];
    for (const [k, col] of Object.entries(map)) if (b[k] !== undefined) { sets.push(`${col} = ?`); vals.push(b[k]); }
    if (b.amenities !== undefined) { sets.push("amenities = ?"); vals.push(JSON.stringify(b.amenities)); }
    if (b.isAirConditioned !== undefined) { sets.push("is_air_conditioned = ?"); vals.push(b.isAirConditioned ? 1 : 0); }
    if (!sets.length) return fail(ctx, 400, "Nothing to update.");
    const [res] = await pool.execute<any>(`UPDATE venues SET ${sets.join(", ")} WHERE id = ?`, [...vals, ctx.params.id]);
    if (!res.affectedRows) return fail(ctx, 404, "Venue not found.");
    await logAudit({ userId: me.id, actor: me.name, role: me.role, action: "VENUE_UPDATED", target: ctx.params.id, ip: clientIp(ctx),
      details: `Fields: ${Object.keys(b).join(", ")}` });
    const [rows] = await pool.execute<any[]>("SELECT * FROM venues WHERE id = ?", [ctx.params.id]);
    return venueRow(rows[0]);
  }), { body: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 160 })), location: t.Optional(t.String({ maxLength: 255 })),
    capacity: t.Optional(t.Number({ minimum: 1 })), type: t.Optional(t.String({ maxLength: 80 })),
    amenities: t.Optional(t.Array(t.String())), department: t.Optional(t.String({ maxLength: 120 })),
    category: t.Optional(t.String()), isAirConditioned: t.Optional(t.Boolean()), status: t.Optional(t.String({ maxLength: 30 })),
    image: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])), hourlyRate: t.Optional(t.String({ maxLength: 80 })) }) })

  // ── Clubs ──
  .post("/clubs", secured(["superadmin"], async (ctx, me) => {
    const b = ctx.body as any;
    try {
      const [res] = await pool.execute<any>("INSERT INTO clubs (name, faculty_advisor_id) VALUES (?, ?)", [b.name.trim(), b.advisorId ?? null]);
      await logAudit({ userId: me.id, actor: me.name, role: me.role, action: "CLUB_CREATED", target: b.name, ip: clientIp(ctx) });
      const [rows] = await pool.execute<any[]>(`SELECT c.*, u.name AS advisor_name FROM clubs c LEFT JOIN users u ON u.id = c.faculty_advisor_id WHERE c.id = ?`, [res.insertId]);
      return clubRow(rows[0]);
    } catch (e: any) {
      if (dup(e)) return fail(ctx, 409, "A club with this name already exists.");
      throw e;
    }
  }), { body: t.Object({ name: t.String({ minLength: 1, maxLength: 190 }), advisorId: t.Optional(t.Union([t.Number(), t.Null()])) }) })
  .put("/clubs/:id", secured(["superadmin"], async (ctx, me) => {
    const b = ctx.body as any;
    if (b.advisorId != null) {
      const [u] = await pool.execute<any[]>("SELECT id FROM users WHERE id = ? AND role = 'faculty' AND is_active = 1", [b.advisorId]);
      if (!u[0]) return fail(ctx, 400, "The advisor must be an active faculty member.");
    }
    const sets: string[] = []; const vals: any[] = [];
    if (b.name !== undefined) { sets.push("name = ?"); vals.push(b.name.trim()); }
    if (b.advisorId !== undefined) { sets.push("faculty_advisor_id = ?"); vals.push(b.advisorId); }
    if (!sets.length) return fail(ctx, 400, "Nothing to update.");
    const [res] = await pool.execute<any>(`UPDATE clubs SET ${sets.join(", ")} WHERE id = ?`, [...vals, ctx.params.id]);
    if (!res.affectedRows) return fail(ctx, 404, "Club not found.");
    // Requests still waiting on the old advisor move to the new one
    if (b.advisorId !== undefined) {
      await pool.execute("UPDATE bookings SET advisor_id = ? WHERE club_id = ? AND status = 'Pending Faculty'", [b.advisorId, ctx.params.id]);
    }
    await logAudit({ userId: me.id, actor: me.name, role: me.role, action: "CLUB_UPDATED", target: `club #${ctx.params.id}`, ip: clientIp(ctx) });
    const [rows] = await pool.execute<any[]>(`SELECT c.*, u.name AS advisor_name FROM clubs c LEFT JOIN users u ON u.id = c.faculty_advisor_id WHERE c.id = ?`, [ctx.params.id]);
    return clubRow(rows[0]);
  }), { body: t.Object({ name: t.Optional(t.String({ minLength: 1, maxLength: 190 })), advisorId: t.Optional(t.Union([t.Number(), t.Null()])) }) });
