/**
 * One-command database setup:
 *   bun run db:init     create database + tables, load demo data if the DB is empty
 *   bun run db:reset    DROP everything and rebuild with fresh demo data
 *
 * Demo logins (password for all: Coep@1234, or DEMO_PASSWORD in .env):
 *   student     deshmukha21.comp@coep.ac.in   (MIS 112103045)
 *   faculty     spatil.comp@coep.ac.in
 *   hod         hod.comp@coep.ac.in
 *   superadmin  registrar@coeptech.ac.in
 */
import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
import { config, dbSsl } from "../config";
import { pool } from "../db";
import { ensureSchema } from "../lib/migrate";

const reset = process.argv.includes("--reset");
const { database, ...conn } = config.db;

const ssl = dbSsl();
const root = await mysql.createConnection({ ...conn, ssl, multipleStatements: true });
await root.query(
  `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await root.end();

const db = await mysql.createConnection({ ...conn, ssl, database, multipleStatements: true });

if (reset) {
  console.log("Dropping existing tables…");
  await db.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS audit_logs, settings, holidays, booking_approvals, bookings, clubs, venues, sessions, users, departments;
    SET FOREIGN_KEY_CHECKS = 1;`);
}

console.log("Creating tables…");
await db.query(readFileSync(join(import.meta.dir, "..", "..", "..", "db", "schema.sql"), "utf8"));

const [[{ n }]] = (await db.query("SELECT COUNT(*) AS n FROM users")) as any;
if (n > 0) {
  console.log(`Users table already has ${n} row(s) – skipping demo data. Use "bun run db:reset" to start over.`);
  await ensureSchema();
  await db.end();
  await pool.end();
  process.exit(0);
}

console.log("Loading demo data…");
const hash = await Bun.password.hash(config.demoPassword);

const departments = [
  "Computer Engineering", "Mechanical Engineering", "Civil Engineering",
  "Electrical Engineering", "Metallurgy Engineering", "Central Estate & Administration Office",
];
for (const [i, name] of departments.entries()) {
  await db.execute("INSERT INTO departments (id, name) VALUES (?, ?)", [i + 1, name]);
}
const dep = (name: string) => departments.indexOf(name) + 1;

// id, name, email, mis, role, dept, designation
const users: [number, string, string, string | null, string, string, string | null][] = [
  [101, "Aarav Deshmukh", "deshmukha21.comp@coep.ac.in", "112103045", "student", "Computer Engineering", "B.Tech Student"],
  [102, "Tanvi Joshi (Student Secretary)", "joshit21.mech@coep.ac.in", "112103046", "student", "Mechanical Engineering", "B.Tech Student"],
  [103, "Team Nemesis BAJA COEP", "baja.mech@coep.ac.in", "112103047", "student", "Mechanical Engineering", "B.Tech Student"],
  [104, "Rohan Gaikwad", "gaikwadr21.civil@coep.ac.in", "112103048", "student", "Civil Engineering", "B.Tech Student"],
  [105, "Music Society Student Body", "spandan.elec@coep.ac.in", "112103049", "student", "Electrical Engineering", "B.Tech Student"],
  [201, "Dr. Sunita Patil", "spatil.comp@coep.ac.in", null, "faculty", "Computer Engineering", "Associate Professor & MindSpark Faculty Incharge"],
  [205, "Prof. Dr. N. B. Dhokey", "nbdhokey.meta@coep.ac.in", null, "faculty", "Metallurgy Engineering", "Professor"],
  [206, "Training & Placement Cell", "placement@coep.ac.in", null, "faculty", "Computer Engineering", "Placement Coordinator"],
  [301, "Prof. Dr. Rajesh Kulkarni", "hod.comp@coep.ac.in", null, "hod", "Computer Engineering", "Head of Department"],
  [401, "Col. Vikram Shinde (Retd.)", "registrar@coeptech.ac.in", null, "superadmin", "Central Estate & Administration Office", "Superadmin / Registrar"],
];
for (const [id, name, email, mis, role, d, designation] of users) {
  await db.execute(
    `INSERT INTO users (id, name, email, mis_number, password_hash, role, department_id, designation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, mis, hash, role, dep(d), designation]
  );
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
const FREE = "Free for Academic";
// id, name, location, capacity, type, amenities, department, ac, status, image
const venues: [string, string, string, number, string, string[], string, number, string, string][] = [
  ["v-auditorium", "Main Auditorium", "North Campus, Main Heritage Building", 900, "Auditorium",
    ["Central AC", "Digital Dolby 7.1", "Dual 4K Laser Projectors", "Green Rooms (2)", "Podium Mic", "Stage Lighting Rig"],
    "Central Administration", 1, "Available", IMG("photo-1517457373958-b7bdd4587205")],
  ["v-boatclub", "COEP Boat Club Lawn & Deck", "Mula Riverfront, South Campus", 650, "Outdoor & Pavilion",
    ["Riverfront Promenade", "Regatta Pavilion", "Open Stage", "Floodlights", "Generator Backup"],
    "Gymkhana & Sports Committee", 0, "Available", IMG("photo-1519750157634-b6d493a0f77c")],
  ["v-mech-hall", "Mechanical Seminar Hall", "Ground Floor, Dept of Mechanical Engineering", 260, "Seminar Hall",
    ["Tiered Amphitheater Seating", "AC", "Motorized Screen", "Lavalier Mics", "Polycom VC"],
    "Mechanical Engineering", 1, "Available", IMG("photo-1505373877841-8d25f7d46678")],
  ["v-comp-hall", "Turing Computer Seminar Hall", "3rd Floor, Academic Complex II (North Campus)", 180, "Smart Seminar Hall",
    ["High-speed WiFi 6", "Interactive Digital Board", "Dual Projection", "Individual Laptop Power Sockets"],
    "Computer Engineering", 1, "Available", IMG("photo-1492684223066-81342ee5ff30")],
  ["v-meta-hall", "Metallurgy AC Auditorium", "Dept of Metallurgy and Materials Science", 150, "Auditorium",
    ["AC", "Surround Sound", "Recording Setup", "Laser Pointer", "VIP Lounge"],
    "Metallurgy Engineering", 1, "Available", IMG("photo-1475721027785-f74eccf877e2")],
  ["v-oat", "Open Air Theatre (OAT)", "Beside Hostel Complex, South Campus", 1200, "Open Air Amphitheatre",
    ["Acoustic Shell", "High-Output PA System", "Spotlights", "Crowd Barricades", "Backstage Stalls"],
    "Gymkhana Cultural Wing", 0, "Available", IMG("photo-1464366400600-7168b8af9bc3")],
  ["v-mini-audi", "B.J. Somaiya Mini Auditorium", "2nd Floor, Main Building", 110, "Conference Hall",
    ["Full AC", "Conference Mic Console", "Overhead Projector", "Executive Seating"],
    "Central Administration", 1, "Under Maintenance", IMG("photo-1511578314322-379afb476865")],
];
for (const [id, name, loc, cap, type, amen, d, ac, status, image] of venues) {
  await db.execute(
    `INSERT INTO venues (id, name, location, capacity, type, amenities, department, is_air_conditioned, status, image, hourly_rate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, loc, cap, type, JSON.stringify(amen), d, ac, status, image, FREE]
  );
}

type B = {
  seq: number; venue: string; title: string; user: number; club?: string; dept: string; date: string; slot: string;
  attendees: number; purpose: string; status: string; approvedBy: string; created: string;
  endorsement?: string; stage: string; rejection?: string;
};
const bookings: B[] = [
  { seq: 81, venue: "v-auditorium", title: "MindSpark 26 Technical Hackathon Inauguration", user: 101,
    club: "MindSpark Tech Club / CSI Student Chapter", dept: "Computer Engineering", date: "2026-10-25",
    slot: "09:00 AM - 01:00 PM", attendees: 450,
    purpose: "National level annual technical fest opening ceremony with keynote address by Industry leaders.",
    status: "Approved", approvedBy: "Col. Vikram Shinde (Superadmin)", created: "2026-10-14 11:20:00",
    endorsement: "Strongly recommended. Faculty advisor verified budget and safety norms.", stage: "Completed Approval" },
  { seq: 82, venue: "v-comp-hall", title: "AI & Quantum Computing Guest Lecture Series", user: 201,
    dept: "Computer Engineering", date: "2026-10-26", slot: "02:00 PM - 05:00 PM", attendees: 120,
    purpose: "Distinguished visiting professor from IISc Bangalore delivering session on Post-Quantum Cryptography.",
    status: "Pending HOD", approvedBy: "Pending review by Prof. Dr. Rajesh Kulkarni", created: "2026-10-18 16:15:00",
    endorsement: "Academic curriculum enrichment program.", stage: "Level 2: HOD Review" },
  { seq: 83, venue: "v-boatclub", title: "Regatta 98 Traditional Alumni Boat Race Briefing", user: 102,
    club: "COEP Boat Club Managing Committee", dept: "Mechanical Engineering", date: "2026-10-28",
    slot: "04:00 PM - 07:30 PM", attendees: 300,
    purpose: "Coordination meeting for historic Regatta races with alumni team captains and safety marshals.",
    status: "Pending Superadmin", approvedBy: "Endorsed by HOD Mechanical. Awaiting Registrar clearance.",
    created: "2026-10-17 09:30:00", endorsement: "Safety equipment and rescue boats reserved.",
    stage: "Level 3: Central Estate Superadmin" },
  { seq: 84, venue: "v-mech-hall", title: "BAJA SAE Racing Vehicle Unveiling Ceremony", user: 103,
    club: "SAE Collegiate Club", dept: "Mechanical Engineering", date: "2026-10-29",
    slot: "10:00 AM - 01:30 PM", attendees: 220,
    purpose: "Unveiling of the newly fabricated all-terrain electric BAJA vehicle for 2026 national championship.",
    status: "Pending Faculty", approvedBy: "Pending Faculty Advisor verification", created: "2026-10-19 10:00:00",
    endorsement: "Awaiting faculty advisor signature.", stage: "Level 1: Faculty Advisor Review" },
  { seq: 85, venue: "v-oat", title: "Zest 26 Inter-Collegiate Sports Fest Cultural Evening", user: 104,
    club: "Zest Sports & Cultural Committee", dept: "Civil Engineering", date: "2026-11-04",
    slot: "05:30 PM - 10:00 PM", attendees: 1100,
    purpose: "Cultural stage performance and musical showcase during inter-college athletics tournament.",
    status: "Approved", approvedBy: "Col. Vikram Shinde (Superadmin)", created: "2026-10-12 14:40:00",
    endorsement: "Security permission obtained from Deccan Police station.", stage: "Completed Approval" },
  { seq: 86, venue: "v-auditorium", title: "Late Night Rock Band Practice Session", user: 105,
    club: "COEP Spandan Music Club", dept: "Electrical Engineering", date: "2026-10-22",
    slot: "08:00 PM - 11:30 PM", attendees: 60, purpose: "Practice session for university festival.",
    status: "Rejected", approvedBy: "Rejected by Prof. Dr. Rajesh Kulkarni", created: "2026-10-15 13:10:00",
    stage: "Rejected",
    rejection: "Exceeds campus noise ordinance and allowable hours after 08:00 PM without special Dean approval." },
  { seq: 87, venue: "v-meta-hall", title: "National Metallurgy Research Colloquium", user: 205,
    dept: "Metallurgy Engineering", date: "2026-10-31", slot: "09:00 AM - 05:00 PM", attendees: 140,
    purpose: "Joint symposium with Tata Steel & ISRO Materials Lab on cryo-treated titanium alloys.",
    status: "Approved", approvedBy: "Col. Vikram Shinde (Superadmin)", created: "2026-10-10 11:00:00",
    endorsement: "Sponsored by DST grant.", stage: "Completed Approval" },
  { seq: 88, venue: "v-comp-hall", title: "Annual Campus Placement Orientation: Microsoft & Google", user: 206,
    dept: "Computer Engineering", date: "2026-11-02", slot: "10:00 AM - 01:00 PM", attendees: 175,
    purpose: "Placement drive mock interview guidelines and coding test briefing for final year students.",
    status: "Approved", approvedBy: "Col. Vikram Shinde (Superadmin)", created: "2026-10-16 15:20:00",
    endorsement: "Critical career activity.", stage: "Completed Approval" },
];
const userById = new Map(users.map((u) => [u[0], u]));
const venueById = new Map(venues.map((v) => [v[0], v]));
for (const b of bookings) {
  const u = userById.get(b.user)!;
  const v = venueById.get(b.venue)!;
  await db.execute(
    `INSERT INTO bookings (seq, id, venue_id, venue_name, title, user_id, booked_by, role, club, department,
        booking_date, time_slot, attendees, purpose, status, approved_by, endorsement, stage, rejection_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.seq, `BK-2026-${String(b.seq).padStart(3, "0")}`, b.venue, v[1], b.title, b.user, u[1], u[4],
     b.club ?? null, b.dept, b.date, b.slot, b.attendees, b.purpose, b.status, b.approvedBy,
     b.endorsement ?? null, b.stage, b.rejection ?? null, b.created]
  );
}

const holidays = [
  ["hol-1", "Diwali Break & Campus Holiday", "2026-11-08", "2026-11-13", "Official University Holiday",
    "State Government Diwali vacation - All academic blocks closed.", "All Venues", "Registrar Office"],
  ["hol-2", "End-Semester Final Theory Examinations (Winter 26)", "2026-11-20", "2026-12-05", "Exam Lockout Window",
    "Strict academic silence required campus-wide. No student fest or cultural bookings permitted.",
    "Main Auditorium, Turing Computer Seminar Hall, Mechanical Seminar Hall", "Controller of Examinations"],
  ["hol-3", "COEP Annual Convocation 2026 Rehearsal & Main Event", "2026-12-18", "2026-12-20", "Administrative Lockdown",
    "State Governor & Chancellor visit. High-security protocol.",
    "Main Auditorium, COEP Boat Club Lawn & Deck", "Col. Vikram Shinde (Superadmin)"],
  ["hol-4", "Republic Day Celebration Setup", "2027-01-25", "2027-01-26", "Official University Holiday",
    "Parade drills, Flag hoisting dais setup, and civic felicitation.",
    "Main Auditorium, COEP Boat Club Lawn & Deck, Open Air Theatre (OAT)", "Central Administration"],
];
for (const h of holidays) {
  await db.execute(
    `INSERT INTO holidays (id, title, start_date, end_date, type, reason, affected_venues, is_strict_block, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, '2026-10-01 10:00:00')`,
    [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]]
  );
}

const { DEFAULT_SETTINGS } = await import("../lib/settings");
await db.execute("INSERT INTO settings (id, data) VALUES (1, ?)", [JSON.stringify(DEFAULT_SETTINGS)]);

const logs: [number, string, string, string, string, string, string, string][] = [
  [401, "Col. Vikram Shinde", "superadmin", "BOOKING_APPROVED", "BK-2026-081 (MindSpark Hackathon)", "SUCCESS",
    "Final approval granted for Main Auditorium. Gate pass auto-dispatched to Campus Security.", "2026-10-19 11:25:10"],
  [101, "Aarav Deshmukh", "student", "BOOKING_SUBMITTED", "BK-2026-084 (BAJA SAE Unveiling)", "SUCCESS",
    "Submitted request for Mechanical Seminar Hall. Attached faculty advisory recommendation.", "2026-10-19 10:14:02"],
  [301, "Prof. Dr. Rajesh Kulkarni", "hod", "BOOKING_REJECTED", "BK-2026-086 (Rock Band Practice)", "WARNING",
    "Rejected with mandatory explanation: Exceeds permitted decibel limits and campus night curfew.", "2026-10-18 16:42:19"],
  [401, "Col. Vikram Shinde", "superadmin", "BLOCKED_DATE_ADDED", "HOL-2 (End-Semester Exam Lockout)", "SUCCESS",
    "Added blocked lockout window from 2026-11-20 to 2026-12-05 for university winter examinations.", "2026-10-17 14:05:30"],
  [201, "Dr. Sunita Patil", "faculty", "PASSWORD_CHANGED", "User Account u-201", "SUCCESS",
    "Password updated through authenticated credential self-service portal.", "2026-10-16 09:12:44"],
  [401, "Col. Vikram Shinde", "superadmin", "SETTINGS_UPDATED", "Global System Settings", "SUCCESS",
    "Updated minLeadTimeDays to 3 and autoEscalateHours to 48 hours.", "2026-10-15 17:30:11"],
];
for (const l of logs) {
  await db.execute(
    `INSERT INTO audit_logs (user_id, actor, role, action, target, status, details, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '10.20.1.4', ?)`,
    [l[0], l[1], l[2], l[3], l[4], l[5], l[6], l[7]]
  );
}

await ensureSchema();   // classifies venues, creates demo clubs, back-fills approval routes
await db.end();
await pool.end();
console.log(`
✅ Database "${database}" is ready.
   Demo password for every account: ${config.demoPassword}
   student     deshmukha21.comp@coep.ac.in  (or MIS 112103045)
   faculty     spatil.comp@coep.ac.in
   hod         hod.comp@coep.ac.in
   superadmin  registrar@coeptech.ac.in`);
