import { Elysia } from "elysia";
import { pool } from "../db";
import { secured } from "../plugins/auth";

export function clubRow(r: any) {
  return {
    id: Number(r.id),
    name: r.name,
    advisorId: r.faculty_advisor_id == null ? null : Number(r.faculty_advisor_id),
    advisorName: r.advisor_name ?? null,
  };
}

export const clubRoutes = new Elysia()
  .get(
    "/clubs",
    secured(null, async () => {
      const [rows] = await pool.execute<any[]>(
        `SELECT c.*, u.name AS advisor_name FROM clubs c
           LEFT JOIN users u ON u.id = c.faculty_advisor_id ORDER BY c.name`
      );
      return rows.map(clubRow);
    })
  )
  .get(
    "/departments",
    secured(null, async () => {
      const [rows] = await pool.execute<any[]>("SELECT id, name FROM departments ORDER BY name");
      return rows.map((r) => ({ id: Number(r.id), name: r.name }));
    })
  );
