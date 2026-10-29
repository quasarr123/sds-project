import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Bun loads backend/.env automatically. Every value has a sensible local default,
// so the server starts even if no .env file exists.
export const config = {
  port: Number(process.env.API_PORT ?? 3001),
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "venue_booking",
  },
  session: {
    hours: Number(process.env.SESSION_HOURS ?? 8),
    idleTimeoutMins: Number(process.env.IDLE_TIMEOUT_MINS ?? 30),
  },
  // Only set COOKIE_SECURE=true when the site is served over HTTPS.
  cookieSecure: process.env.COOKIE_SECURE === "true",
  demoPassword: process.env.DEMO_PASSWORD ?? "Coep@1234",
};

/**
 * TLS settings for a hosted database (e.g. Aiven). A local database (localhost) uses no TLS.
 * The CA certificate is read from DB_SSL_CA, or backend/certs/ca.pem by default.
 */
export function dbSsl() {
  if (["localhost", "127.0.0.1"].includes(config.db.host)) return undefined;
  const caPath = process.env.DB_SSL_CA ?? join(import.meta.dir, "..", "certs", "ca.pem");
  if (!existsSync(caPath)) return { rejectUnauthorized: true };
  return { ca: readFileSync(caPath, "utf8"), rejectUnauthorized: true };
}
