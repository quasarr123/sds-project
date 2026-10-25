import { Elysia } from "elysia";
import { pool } from "../db";
import { secured } from "../plugins/auth";

export function venueRow(r: any) {
  let amenities: string[] = [];
  try { amenities = JSON.parse(r.amenities); } catch {}
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    capacity: Number(r.capacity),
    type: r.type,
    amenities,
    department: r.department,
    isAirConditioned: !!r.is_air_conditioned,
    status: r.status,
    image: r.image,
    hourlyRate: r.hourly_rate,
    category: r.category ?? "department",
  };
}

export const venueRoutes = new Elysia({ prefix: "/venues" }).get(
  "/",
  secured(null, async () => {
    const [rows] = await pool.execute<any[]>("SELECT * FROM venues ORDER BY capacity DESC, name");
    return rows.map(venueRow);
  })
);
