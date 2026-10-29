import { existsSync } from "fs";
import { join, normalize } from "path";
import { Elysia } from "elysia";
import { config } from "./config";
import { pool } from "./db";
import { authRoutes } from "./routes/auth";
import { venueRoutes } from "./routes/venues";
import { bookingRoutes } from "./routes/bookings";
import { holidayRoutes } from "./routes/holidays";
import { settingsRoutes } from "./routes/settings";
import { auditRoutes } from "./routes/audit";
import { clubRoutes } from "./routes/clubs";
import { adminRoutes } from "./routes/admin";
import { ensureSchema } from "./lib/migrate";

// Bring the (possibly already online) database up to date before serving requests.
await ensureSchema();

const api = new Elysia({ prefix: "/api" })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { message: "Invalid request data. Please check the form and try again." };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { message: "Not found" };
    }
    console.error(error);
    set.status = 500;
    return { message: "Internal server error" };
  })
  .get("/health", async () => {
    const [rows] = await pool.query("SELECT 1 AS ok");
    return { status: "ok", db: (rows as any[])[0].ok === 1 };
  })
  .use(authRoutes)
  .use(venueRoutes)
  .use(bookingRoutes)
  .use(holidayRoutes)
  .use(settingsRoutes)
  .use(auditRoutes)
  .use(clubRoutes)
  .use(adminRoutes);

const app = new Elysia().use(api);

// After the frontend is built (bun run build), this same process can serve frontend/dist.
const dist = join(import.meta.dir, "..", "..", "frontend", "dist");
if (existsSync(join(dist, "index.html"))) {
  app.get("/*", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    const full = join(dist, path);
    const index = Bun.file(join(dist, "index.html"));
    if (!full.startsWith(dist) || path.endsWith("/") || path.endsWith("\\")) return index;
    const file = Bun.file(full);
    return file.size > 0 ? file : index;
  });
}

app.listen(config.port);
console.log(`API running on http://localhost:${app.server?.port}/api`);

async function shutdown() {
  await app.stop();
  await pool.end();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
