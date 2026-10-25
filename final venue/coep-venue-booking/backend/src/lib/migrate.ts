/**
 * Idempotent schema upgrade. Safe to run on every start and on an existing (online) database:
 * it only adds what is missing and back-fills old rows. No data is dropped.
 */
import { pool } from "../db";
import { minutesToTime, parseSlot } from "./time";

async function hasColumn(table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query<any[]>(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumn(table: string, column: string, ddl: string) {
  if (!(await hasColumn(table, column))) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
    console.log(`[migrate] added ${table}.${column}`);
  }
}

// Demo data classification (only applied to rows that have not been classified yet)
const VENUE_CATEGORY: Record<string, string> = {
  "v-auditorium": "central",   // Main Auditorium
  "v-mini-audi": "central",    // Mini Auditorium
  "v-boatclub": "club",
  "v-oat": "club",
  "v-mech-hall": "department",
  "v-comp-hall": "department",
  "v-meta-hall": "department",
};
// club name -> advisor user id (demo users)
const DEMO_CLUBS: [string, number][] = [
  ["MindSpark Tech Club / CSI Student Chapter", 201],
  ["COEP Boat Club Managing Committee", 205],
  ["SAE Collegiate Club", 205],
  ["Zest Sports & Cultural Committee", 205],
  ["COEP Spandan Music Club", 201],
];

export async function ensureSchema(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS clubs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL UNIQUE,
    faculty_advisor_id INT UNSIGNED NULL,
    CONSTRAINT fk_clubs_advisor FOREIGN KEY (faculty_advisor_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS booking_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(30) NOT NULL,
    step VARCHAR(20) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    approver_id INT UNSIGNED NULL,
    approver_name VARCHAR(160) NOT NULL,
    approver_role VARCHAR(20) NOT NULL,
    note TEXT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_approvals_booking (booking_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await addColumn("venues", "category", "VARCHAR(20) NULL");
  await addColumn("bookings", "booking_type", "VARCHAR(20) NULL");
  await addColumn("bookings", "route", "VARCHAR(20) NULL");
  await addColumn("bookings", "club_id", "INT UNSIGNED NULL");
  await addColumn("bookings", "advisor_id", "INT UNSIGNED NULL");
  await addColumn("bookings", "review_department", "VARCHAR(120) NULL");
  // Part 2: real time columns (parsed from time_slot) so overlaps are checked as time ranges.
  await addColumn("bookings", "start_time", "TIME NULL");
  await addColumn("bookings", "end_time", "TIME NULL");

  // ── Back-fill venues ──
  for (const [id, cat] of Object.entries(VENUE_CATEGORY)) {
    await pool.execute("UPDATE venues SET category = ? WHERE id = ? AND category IS NULL", [cat, id]);
  }
  await pool.query("UPDATE venues SET category = 'department' WHERE category IS NULL");

  // ── Demo clubs (only if the advisor account exists and the club is not there yet) ──
  for (const [name, advisor] of DEMO_CLUBS) {
    const [u] = await pool.execute<any[]>("SELECT id FROM users WHERE id = ? AND role = 'faculty'", [advisor]);
    if (!u[0]) continue;
    await pool.execute("INSERT IGNORE INTO clubs (name, faculty_advisor_id) VALUES (?, ?)", [name, advisor]);
  }

  // ── Back-fill bookings created under the old 3-level chain ──
  await pool.query(`UPDATE bookings SET route = CASE status
        WHEN 'Pending Faculty' THEN 'club'
        WHEN 'Pending HOD' THEN 'hod'
        ELSE COALESCE(route, 'superadmin') END
      WHERE route IS NULL`);
  await pool.query(`UPDATE bookings SET booking_type = CASE
        WHEN role = 'student' AND club IS NOT NULL THEN 'club'
        WHEN role = 'student' THEN 'regular'
        WHEN role = 'faculty' THEN 'other'
        ELSE 'other' END
      WHERE booking_type IS NULL`);
  await pool.query(`UPDATE bookings b JOIN clubs c ON c.name = b.club
      SET b.club_id = c.id, b.advisor_id = c.faculty_advisor_id
      WHERE b.club_id IS NULL AND b.club IS NOT NULL`);
  await pool.query(`UPDATE bookings SET review_department = department
      WHERE review_department IS NULL AND department IS NOT NULL`);

  // ── Back-fill start/end times from the display text ──
  const [untimed] = await pool.query<any[]>("SELECT seq, time_slot FROM bookings WHERE start_time IS NULL");
  let skipped = 0;
  for (const r of untimed) {
    const slot = parseSlot(r.time_slot);
    if (!slot) { skipped++; continue; }
    await pool.execute("UPDATE bookings SET start_time = ?, end_time = ? WHERE seq = ?",
      [minutesToTime(slot.start), minutesToTime(slot.end), r.seq]);
  }
  if (untimed.length) {
    console.log(`[migrate] filled start/end time for ${untimed.length - skipped} booking(s)` +
      (skipped ? `; ${skipped} had an unreadable time slot and do not block availability` : ""));
  }
}
