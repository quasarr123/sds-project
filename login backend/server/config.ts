
export const config = {
  port: Number(process.env.PORT ?? 3001),

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
};
