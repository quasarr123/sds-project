import { Elysia, t } from "elysia";
import { pool, withTx } from "../db";
import { config } from "../config";
import {
  USER_SELECT, clientIp, fail, newSessionToken, secured, sha256, toSessionUser,
} from "../plugins/auth";
import { logAudit } from "../lib/audit";

// Very small in-memory brute-force guard: 5 failures / 10 min per identifier+ip.
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_FAILS = 5;

// ── Self-registration settings ──
const REGISTRATION_ROLES = ["student", "faculty"];   // HOD / superadmin can NEVER self-register
const FACULTY_NEEDS_APPROVAL = true;                 // true = faculty start inactive until Superadmin approves
const COEP_EMAIL = /^[^@\s]+@(coep\.ac\.in|coeptech\.ac\.in)$/;
const regAttempts = new Map<string, { count: number; first: number }>();
const REG_WINDOW_MS = 60 * 60_000;
const REG_MAX = 10;                                  // sign-ups per IP per hour

function isLocked(key: string): boolean {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(key); return false; }
  return f.count >= MAX_FAILS;
}
function recordFailure(key: string) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else f.count++;
}

export const authRoutes = new Elysia({ prefix: "/auth" })

  .post(
    "/login",
    async (ctx: any) => {
      const { body, cookie, request } = ctx;
      const identifier = String(body.identifier).trim();
      const password = String(body.password);
      const ip = clientIp(ctx);
      const key = `${identifier.toLowerCase()}|${ip}`;

      if (isLocked(key)) {
        return fail(ctx, 429, "Too many failed attempts. Please try again in a few minutes.");
      }

      const [rows] = await pool.execute<any[]>(
        `SELECT ${USER_SELECT}, u.password_hash, u.is_active
           FROM users u LEFT JOIN departments d ON d.id = u.department_id
          WHERE u.email = ? OR u.mis_number = ? LIMIT 1`,
        [identifier, identifier]
      );
      const user = rows[0];

      let valid = false;
      if (user?.password_hash) {
        try {
          valid = await Bun.password.verify(password, user.password_hash);
        } catch {
          valid = false; // unsupported / malformed hash in DB
        }
      }

      if (!user || !valid) {
        recordFailure(key);
        await logAudit({
          actor: identifier, role: user?.role ?? "unknown", action: "LOGIN_FAILED",
          target: `Session ${identifier}`, ip, status: "WARNING",
          details: "Invalid credentials supplied.",
        });
        return fail(ctx, 401, "Invalid credentials");
      }
      if (!user.is_active) {
        return fail(ctx, 403, "Account is disabled. Contact the administrator.");
      }

      failures.delete(key);
      const token = newSessionToken();
      const ua = request.headers.get("user-agent");

      await withTx(async (conn) => {
        await conn.execute(
          `INSERT INTO sessions (token_hash, user_id, expires_at, last_seen_at, ip, user_agent)
           VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR), UTC_TIMESTAMP(), ?, ?)`,
          [token.hash, user.id, config.session.hours, ip.slice(0, 45), ua ? ua.slice(0, 500) : null]
        );
        await conn.execute("UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [user.id]);
      });

      cookie.sid.set({
        value: token.raw,
        httpOnly: true,
        secure: config.cookieSecure,
        sameSite: "lax",
        path: "/",
        maxAge: config.session.hours * 60 * 60,
      });

      await logAudit({
        userId: user.id, actor: user.name, role: user.role, action: "USER_LOGIN",
        target: `Session ${user.email}`, ip, details: "Successful authenticated login.",
      });

      return { message: "Login successful", user: toSessionUser(user) };
    },
    {
      body: t.Object({
        identifier: t.String({ minLength: 1, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
    }
  )

  .post("/logout", async (ctx: any) => {
    const raw = ctx.cookie?.sid?.value;
    if (typeof raw === "string" && raw) {
      const [rows] = await pool.execute<any[]>(
        `SELECT u.id, u.name, u.role, u.email FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? LIMIT 1`,
        [sha256(raw)]
      );
      await pool.execute("DELETE FROM sessions WHERE token_hash = ?", [sha256(raw)]);
      const u = rows[0];
      if (u) {
        await logAudit({
          userId: u.id, actor: u.name, role: u.role, action: "USER_LOGOUT",
          target: `Session ${u.email}`, ip: clientIp(ctx), details: "User terminated active session.",
        });
      }
    }
    ctx.cookie.sid.remove();
    return { ok: true };
  })

  .get("/me", secured(null, (_ctx, user) => ({ user })))

  .post(
    "/change-password",
    secured(null, async (ctx, user) => {
      const { currentPassword, newPassword } = ctx.body as { currentPassword: string; newPassword: string };

      if (newPassword.length < 8) {
        return fail(ctx, 400, "New password must be at least 8 characters.");
      }
      if (newPassword === currentPassword) {
        return fail(ctx, 400, "New password must be different from the current password.");
      }

      const [rows] = await pool.execute<any[]>("SELECT password_hash FROM users WHERE id = ?", [user.id]);
      let ok = false;
      try {
        ok = !!rows[0] && (await Bun.password.verify(currentPassword, rows[0].password_hash));
      } catch {
        ok = false;
      }
      if (!ok) return fail(ctx, 400, "Current password is incorrect.");

      const hash = await Bun.password.hash(newPassword);
      const currentHash = sha256(String(ctx.cookie.sid.value));
      await withTx(async (conn) => {
        await conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, user.id]);
        // sign out every other device
        await conn.execute("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?", [user.id, currentHash]);
      });

      await logAudit({
        userId: user.id, actor: user.name, role: user.role, action: "PASSWORD_CHANGED",
        target: `User ${user.email}`, ip: clientIp(ctx),
        details: "User self-service password update.",
      });
      return { ok: true };
    }),
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1, maxLength: 255 }),
        newPassword: t.String({ minLength: 1, maxLength: 255 }),
      }),
    }
  )

  .get("/departments", async () => {
    const [rows] = await pool.execute<any[]>("SELECT id, name FROM departments ORDER BY name");
    return rows.map((r) => ({ id: Number(r.id), name: r.name }));
  })

  .post(
    "/register",
    async (ctx: any) => {
      const b = ctx.body as any;
      const ip = clientIp(ctx);
      const role = String(b.role);

      if (!REGISTRATION_ROLES.includes(role)) {
        return fail(ctx, 400, "Only students and faculty can self-register.");
      }

      const email = String(b.email).trim().toLowerCase();
      if (!COEP_EMAIL.test(email)) {
        return fail(ctx, 400, "Email must end with @coep.ac.in or @coeptech.ac.in");
      }

      const name = String(b.name).trim();
      if (!name) return fail(ctx, 400, "Name is required.");

      const password = String(b.password);
      if (password.length < 8) {
        return fail(ctx, 400, "Password must be at least 8 characters long.");
      }

      const departmentId = Number(b.departmentId);
      if (!departmentId || isNaN(departmentId)) {
        return fail(ctx, 400, "Please select a valid department.");
      }
      const [depRows] = await pool.execute<any[]>("SELECT id FROM departments WHERE id = ?", [departmentId]);
      if (!depRows[0]) return fail(ctx, 400, "Selected department does not exist.");

      let misNumber: string | null = null;
      if (role === "student") {
        misNumber = String(b.misNumber || "").trim();
        if (!misNumber || misNumber.length > 20 || !/^[a-zA-Z0-9_\-\s]{1,20}$/.test(misNumber)) {
          return fail(ctx, 400, "Enter a valid MIS number (up to 20 characters).");
        }
      }

      const isActive = role === "faculty" && FACULTY_NEEDS_APPROVAL ? 0 : 1;
      const designation = role === "student" ? "Student" : "Faculty Member";

      const hash = await Bun.password.hash(password);
      try {
        const [res] = await pool.execute<any>(
          `INSERT INTO users (name, email, mis_number, password_hash, role, department_id, designation, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, email, misNumber, hash, role, departmentId, designation, isActive]
        );

        await logAudit({
          userId: res.insertId,
          actor: name,
          role,
          action: "USER_REGISTERED",
          target: `${email} (${role})`,
          ip,
          details: isActive ? "Account active immediately." : "Pending superadmin approval.",
        });

        return {
          message: isActive
            ? "Account created successfully. You can now log in."
            : "Account submitted. Awaiting Superadmin clearance before first sign-in.",
        };
      } catch (e: any) {
        if (e?.errno === 1062) {
          return fail(ctx, 409, "A user with this email or MIS number already exists.");
        }
        throw e;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 120 }),
        email: t.String({ maxLength: 190 }),
        role: t.String(),
        departmentId: t.Number(),
        password: t.String({ minLength: 8, maxLength: 255 }),
        misNumber: t.Optional(t.Union([t.String({ maxLength: 20 }), t.Null()])),
      }),
    }
  );
