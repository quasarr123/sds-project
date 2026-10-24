
import { Elysia, t } from "elysia";
import { pool, withTx } from "../db";
import { config } from "../config";
import {
  authPlugin,
  newSessionToken,
  sha256,
  type SessionUser,
  type UserRole,
} from "../plugins/auth";

const allowedRoles: UserRole[] = [
  "student",
  "faculty",
  "hod",
  "superadmin",
];

interface DatabaseUser extends SessionUser {
  password_hash: string;
  is_active: number | boolean;
}

function publicUser(row: DatabaseUser): SessionUser {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    mis_number: row.mis_number,
    role: row.role,
    department_id: row.department_id,
  };
}

export const authRoutes = new Elysia({ prefix: "/auth" })

  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, cookie, request, status }) => {
      const identifier = body.identifier.trim();
      const password = body.password;

      const [rows] = await pool.execute(
        `SELECT
           id, name, email, mis_number, role,
           department_id, password_hash, is_active
         FROM users
         WHERE email = ? OR mis_number = ?
         LIMIT 1`,
        [identifier, identifier],
      );

      const user = (rows as DatabaseUser[])[0];

      if (
        !user ||
        !(await Bun.password.verify(password, user.password_hash))
      ) {
        return status(401, { message: "Invalid credentials" });
      }

      if (!user.is_active) {
        return status(403, { message: "Account is inactive" });
      }

      if (!allowedRoles.includes(user.role)) {
        return status(403, { message: "Unsupported account role" });
      }

      const token = newSessionToken();
      const expiresInHours = config.session.hours;

      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip =
        forwardedFor?.split(",")[0]?.trim() ??
        request.headers.get("cf-connecting-ip") ??
        null;

      const userAgent = request.headers.get("user-agent");

      await withTx(async (connection) => {
        await connection.execute(
          `INSERT INTO sessions
            (token_hash, user_id, expires_at, last_seen_at, ip, user_agent)
           VALUES
            (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR),
             UTC_TIMESTAMP(), ?, ?)`,
          [
            token.hash,
            user.id,
            expiresInHours,
            ip,
            userAgent,
          ],
        );
      });

      cookie.sid?.set({
        value: token.raw,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expiresInHours * 60 * 60,
      });

      return {
        message: "Login successful",
        user: publicUser(user),
      };
    },
    {
      body: t.Object({
        identifier: t.String({ minLength: 1, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
    },
  )

  // POST /api/auth/logout
  .post("/logout", async ({ cookie }) => {
    const cookieValue = cookie.sid?.value;
    const raw = typeof cookieValue === "string" ? cookieValue : undefined;

    if (raw) {
      await pool.execute(
        "DELETE FROM sessions WHERE token_hash = ?",
        [sha256(raw)],
      );
    }

    cookie.sid?.remove();

    return { ok: true };
  })

  // GET /api/auth/me
  .use(authPlugin)
  .get("/me", ({ user }) => ({ user }));
