import mysql, { type PoolConnection } from "mysql2/promise";
import { config } from "./config";

export const pool = mysql.createPool({
  ...config.db,
  connectionLimit: 10,
  waitForConnections: true,
  timezone: "Z",     // treat all DATETIMEs as UTC
  dateStrings: true, // return 'YYYY-MM-DD HH:MM:SS' strings, not JS Dates
});

// Runs fn inside a transaction. Retries on deadlock (1213) and lock wait timeout (1205).
export async function withTx<T>(
  fn: (conn: PoolConnection) => Promise<T>,
  retries = 2
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (e: any) {
      await conn.rollback();
      const retryable = e?.errno === 1213 || e?.errno === 1205;
      if (retryable && attempt < retries) continue;
      throw e;
    } finally {
      conn.release();
    }
  }
}