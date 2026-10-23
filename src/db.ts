import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "sds_user",
  password: process.env.DB_PASSWORD || "sds_pass123",
  database: process.env.DB_NAME || "venue_booking",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
  dateStrings: true,
});
