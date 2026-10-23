// src/types/mysql2-promise.d.ts
// Minimal declaration for the promise‑based MySQL2 API used in the project.
// This satisfies the TypeScript compiler when `import mysql from 'mysql2/promise'`
// is used. It re‑exports the parts we need (createPool) and provides basic
// typings for the pool and query result types.

declare module "mysql2/promise" {
  import type { Pool, PoolOptions, RowDataPacket, OkPacket } from "mysql2";

  const mysql: {
    /** Create a connection pool. */
    createPool(options: PoolOptions): Pool;
    /** Create a single connection (rarely used in this codebase). */
    createConnection?(options: PoolOptions): Promise<any>;
  };

  export default mysql;
}
