
import mysql, { type PoolConnection } from "mysql2/promise";
import { config, dbSsl } from "./config";

export const pool = mysql.createPool({
  ...config.db,
  ssl: dbSsl(),
  connectionLimit: 10,
  waitForConnections: true,
  timezone: "Z",
  dateStrings: true,
});

export type Executor = Pick<PoolConnection, "execute"> | typeof pool;

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
      await conn.rollback().catch(() => {});
      const retryable = e?.errno === 1213 || e?.errno === 1205;

      if (retryable && attempt < retries) continue;

      throw e;
    } finally {
      conn.release();
    }
  }
}
