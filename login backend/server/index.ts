
import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import { pool } from "./db";
import { config } from "./config";

const app = new Elysia({ prefix: "/api" })
  .get("/health", () => ({
    status: "ok",
    message: "Venue Booking System API is running",
  }))
  .use(authRoutes)
  .listen(config.port);

console.log(
  `Venue Booking System API running at http://localhost:${config.port}`,
);

process.on("SIGINT", async () => {
  await app.stop();
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await app.stop();
  await pool.end();
  process.exit(0);
});
