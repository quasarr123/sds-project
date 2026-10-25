import { Elysia } from "elysia";
import { config } from "./config";
import { pool } from "./db";

const app = new Elysia({ prefix: "/api" })
  .get("/health", async () => {
    const [rows] = await pool.query("SELECT 1 AS ok");
    return { status: "ok", db: (rows as any[])[0].ok === 1 };
  })
  .listen(config.port);

console.log(`API running on http://localhost:${app.server?.port}/api`);