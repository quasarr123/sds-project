import { serve } from "bun";
import index from "./index.html";
import { pool } from "./db";

const server = serve({
  routes: {
    // Admin Users API
    "/admin/users": {
      async GET() {
        try {
          const [rows] = await pool.query(
            "SELECT id, name, email, role, department_id, is_active FROM users ORDER BY id ASC"
          );
          const users = (rows as any[]).map((r) => ({
            ...r,
            is_active: Boolean(r.is_active),
          }));
          return Response.json(users);
        } catch (err: any) {
          console.error("GET /admin/users error:", err);
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
      async POST(req) {
        try {
          const body = await req.json();
          const { name, email, role, department_id } = body;
          const dummyHash = "$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7";
          const [result] = await pool.query(
            "INSERT INTO users (name, email, role, department_id, password_hash, is_active) VALUES (?, ?, ?, ?, ?, 1)",
            [name.trim(), email.trim().toLowerCase(), role, department_id ?? null, dummyHash]
          );
          const insertId = (result as any).insertId;
          const [newRows] = await pool.query(
            "SELECT id, name, email, role, department_id, is_active FROM users WHERE id = ?",
            [insertId]
          );
          const created = (newRows as any[])[0];
          return Response.json({ ...created, is_active: Boolean(created.is_active) });
        } catch (err: any) {
          console.error("POST /admin/users error:", err);
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
    },

    "/admin/users/:id": {
      async PATCH(req) {
        try {
          const id = Number(req.params.id);
          const body = await req.json();
          const updates: string[] = [];
          const values: any[] = [];

          if (body.name !== undefined) {
            updates.push("name = ?");
            values.push(body.name.trim());
          }
          if (body.email !== undefined) {
            updates.push("email = ?");
            values.push(body.email.trim().toLowerCase());
          }
          if (body.role !== undefined) {
            updates.push("role = ?");
            values.push(body.role);
          }
          if (body.department_id !== undefined) {
            updates.push("department_id = ?");
            values.push(body.department_id);
          }
          if (body.is_active !== undefined) {
            updates.push("is_active = ?");
            values.push(body.is_active ? 1 : 0);
          }

          if (updates.length > 0) {
            values.push(id);
            await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
          }

          const [rows] = await pool.query(
            "SELECT id, name, email, role, department_id, is_active FROM users WHERE id = ?",
            [id]
          );
          const updated = (rows as any[])[0];
          return Response.json({ ...updated, is_active: Boolean(updated.is_active) });
        } catch (err: any) {
          console.error("PATCH /admin/users/:id error:", err);
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
    },

    // Admin Departments API
    "/admin/departments": {
      async GET() {
        try {
          const [rows] = await pool.query(
            "SELECT id, name, hod_id FROM departments ORDER BY id ASC"
          );
          return Response.json(rows);
        } catch (err: any) {
          console.error("GET /admin/departments error:", err);
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
      async POST(req) {
        try {
          const body = await req.json();
          const { name, hod_id } = body;
          const [result] = await pool.query(
            "INSERT INTO departments (name, hod_id) VALUES (?, ?)",
            [name.trim(), hod_id ?? null]
          );
          const insertId = (result as any).insertId;
          const [newRows] = await pool.query(
            "SELECT id, name, hod_id FROM departments WHERE id = ?",
            [insertId]
          );
          return Response.json((newRows as any[])[0]);
        } catch (err: any) {
          console.error("POST /admin/departments error:", err);
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
    },

    "/admin/departments/:id": {
      async PATCH(req) {
        try {
          const id = Number(req.params.id);
          const body = await req.json();
          const updates: string[] = [];
          const values: any[] = [];

          if (body.name !== undefined) {
            updates.push("name = ?");
            values.push(body.name.trim());
          }
          if (body.hod_id !== undefined) {
            updates.push("hod_id = ?");
            values.push(body.hod_id);
          }

          if (updates.length > 0) {
            values.push(id);
            await pool.query(`UPDATE departments SET ${updates.join(", ")} WHERE id = ?`, values);
          }

          const [rows] = await pool.query(
            "SELECT id, name, hod_id FROM departments WHERE id = ?",
            [id]
          );
          return Response.json((rows as any[])[0]);
        } catch (err: any) {
          console.error("PATCH /admin/departments/:id error:", err);
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
    },

    // Serve index.html for all client-side routes (SPA fallback)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
