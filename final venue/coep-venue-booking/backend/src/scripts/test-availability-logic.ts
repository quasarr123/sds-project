/**
 * Offline check of the availability rules (PDF 2). No server or database needed:
 *   bun run test:availability-logic
 * The SQL layer is replaced by a tiny in-memory table that applies the same overlap condition,
 * so this verifies the rules, the status mapping and the messages. The live test
 * (test:availability) covers the real MySQL locking.
 */
import {
  assertSlotFree, conflictMessage, dayAvailability, findConflicts, freeWindows, overlapOf,
} from "../lib/availability";
import { fmtRange, parseSlot } from "../lib/time";
import { HttpError } from "../lib/http";

let pass = 0, failN = 0;
function check(name: string, ok: boolean, extra = "") {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${ok ? "" : "  → " + extra}`);
  ok ? pass++ : failN++;
}
const slot = (s: string) => parseSlot(s)!;

// ── In-memory stand-in for the bookings table ────────────────────────────────
type Row = { id: string; venue_id: string; booking_date: string; status: string; start_time: string; end_time: string };
const table: Row[] = [];
const add = (id: string, status: string, range: string, venue = "v1", date = "2026-11-02") => {
  const s = slot(range);
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
  table.push({ id, venue_id: venue, booking_date: date, status, start_time: hhmm(s.start), end_time: hhmm(s.end) });
};
/** Understands exactly the query shape used by lib/availability.ts. */
const fakeDb: any = {
  async execute(sql: string, p: unknown[]) {
    const nStatuses = (/IN \(([?,]+)\)/.exec(sql)![1]!.match(/\?/g) ?? []).length;
    const [venue, date] = p as string[];
    const statuses = p.slice(2, 2 + nStatuses) as string[];
    const exclude = p[2 + nStatuses] as string;
    const within = sql.includes("start_time < ?") ? { end: p[3 + nStatuses] as string, start: p[4 + nStatuses] as string } : null;
    const rows = table
      .filter((r) => r.venue_id === venue && r.booking_date === date && statuses.includes(r.status) && r.id !== exclude)
      .filter((r) => !within || (r.start_time < within.end && r.end_time > within.start))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return [rows];
  },
};

const D = "2026-11-02";
add("A", "Pending HOD", "03:00 PM - 04:00 PM");

console.log("\nTime overlap (PDF example: existing 3:00-4:00 PM)");
let c = await findConflicts(fakeDb, "v1", D, slot("03:30 PM - 04:30 PM"));
check("3:30-4:30 PM conflicts", c.length === 1, JSON.stringify(c));
check("actual overlap shown is 3:30 PM – 4:00 PM", c[0]?.overlap === "3:30 PM – 4:00 PM", c[0]?.overlap);
check("existing booking range is reported", c[0]?.booked === "3:00 PM – 4:00 PM", c[0]?.booked);
c = await findConflicts(fakeDb, "v1", D, slot("04:00 PM - 04:30 PM"));
check("4:00-4:30 PM is available", c.length === 0, JSON.stringify(c));
c = await findConflicts(fakeDb, "v1", D, slot("04:00 PM - 05:00 PM"));
check("adjacent slot 4:00-5:00 PM after 3:00-4:00 PM is allowed", c.length === 0, JSON.stringify(c));
c = await findConflicts(fakeDb, "v1", D, slot("02:00 PM - 03:00 PM"));
check("adjacent slot ending exactly when the booking starts is allowed", c.length === 0, JSON.stringify(c));
c = await findConflicts(fakeDb, "v1", D, slot("09:00 AM - 05:00 PM"));
check("a longer request that contains the booking conflicts", c.length === 1 && c[0]!.overlap === "3:00 PM – 4:00 PM", JSON.stringify(c));
c = await findConflicts(fakeDb, "v1", D, slot("03:15 PM - 03:45 PM"));
check("a request inside the booking conflicts", c.length === 1 && c[0]!.overlap === "3:15 PM – 3:45 PM", JSON.stringify(c));
check("same time at another venue is free", (await findConflicts(fakeDb, "v2", D, slot("03:00 PM - 04:00 PM"))).length === 0);
check("same time on another date is free", (await findConflicts(fakeDb, "v1", "2026-11-03", slot("03:00 PM - 04:00 PM"))).length === 0);

console.log("\nWhich statuses hold a slot");
c = await findConflicts(fakeDb, "v1", D, slot("03:00 PM - 04:00 PM"));
check("Pending booking blocks and is reported as PENDING", c[0]?.state === "PENDING", JSON.stringify(c));
check("PENDING message matches the spec", c[0]?.message === "This slot is undergoing approval. Please wait or choose another time.", c[0]?.message);
add("B", "Approved", "06:00 PM - 07:00 PM");
c = await findConflicts(fakeDb, "v1", D, slot("06:30 PM - 07:30 PM"));
check("Approved booking blocks and is reported as CONFIRMED", c[0]?.state === "CONFIRMED", JSON.stringify(c));
check("CONFIRMED message matches the spec", c[0]?.message === "This time slot is booked. Please choose another time.", c[0]?.message);
const otherPending: [string, string, string][] = [
  ["Pending Faculty", "10:00 AM - 11:00 AM", "10:30 AM - 11:30 AM"],
  ["Pending Superadmin", "08:00 AM - 09:00 AM", "08:30 AM - 09:30 AM"],
];
for (const [status, booked, request] of otherPending) {
  add(`S-${status}`, status, booked);
  check(`${status} blocks`, (await findConflicts(fakeDb, "v1", D, slot(request))).length === 1);
}
for (const status of ["Rejected", "Cancelled"]) {
  add(`R-${status}`, status, "12:00 PM - 01:00 PM");
  check(`${status} releases the slot`, (await findConflicts(fakeDb, "v1", D, slot("12:00 PM - 01:00 PM"))).length === 0);
}

console.log("\nassertSlotFree (what booking creation uses)");
let err: unknown;
try { await assertSlotFree(fakeDb, "v1", D, slot("03:30 PM - 04:30 PM")); } catch (e) { err = e; }
check("throws HttpError 409 on a clash", err instanceof HttpError && err.code === 409, String(err));
check("error carries the message with the overlap", err instanceof HttpError && err.message.includes("3:30 PM – 4:00 PM") && err.message.includes("undergoing approval"), (err as Error)?.message);
check("error carries structured conflicts for the UI", err instanceof HttpError && Array.isArray(err.data?.conflicts) && err.data?.available === false);
err = undefined;
try { await assertSlotFree(fakeDb, "v1", D, slot("04:00 PM - 05:00 PM")); } catch (e) { err = e; }
check("does not throw when the slot is free", err === undefined, String(err));
err = undefined;
try { await assertSlotFree(fakeDb, "v1", D, slot("03:00 PM - 04:00 PM"), { excludeId: "A" }); } catch (e) { err = e; }
check("a booking never conflicts with itself (excludeId)", err === undefined, String(err));
err = undefined;
try { await assertSlotFree(fakeDb, "v1", D, slot("03:00 PM - 04:00 PM"), { confirmedOnly: true }); } catch (e) { err = e; }
check("confirmedOnly ignores pending bookings (approval re-check)", err === undefined, String(err));

console.log("\nMessages");
const both = [
  { state: "PENDING" as const, booked: "", overlap: "10:00 AM – 11:00 AM", message: "This slot is undergoing approval. Please wait or choose another time." },
  { state: "CONFIRMED" as const, booked: "", overlap: "11:00 AM – 12:00 PM", message: "This time slot is booked. Please choose another time." },
];
check("a confirmed clash takes priority over a pending one", conflictMessage(both).startsWith("This time slot is booked."), conflictMessage(both));
check("all overlapping ranges are listed", conflictMessage(both).includes("10:00 AM – 11:00 AM, 11:00 AM – 12:00 PM"), conflictMessage(both));

console.log("\nDay view");
const hours = { start: 7 * 60 + 30, end: 21 * 60 + 30 };
let day: any = await dayAvailability(fakeDb, "v1", D, null, hours);
check("lists busy ranges with their state", day.busy.some((b: any) => b.state === "PENDING" && b.start === "15:00" && b.end === "16:00"), JSON.stringify(day.busy));
check("does not leak who booked or why", !JSON.stringify(day).match(/title|booked_by|purpose|user/i));
check("without a requested slot there is no verdict", day.available === undefined);
day = await dayAvailability(fakeDb, "v1", D, slot("04:00 PM - 05:00 PM"), hours);
check("with a requested slot: available true and message", day.available === true && day.message === "This slot is available.", JSON.stringify(day));
day = await dayAvailability(fakeDb, "v1", D, slot("03:30 PM - 04:30 PM"), hours);
check("with a clashing slot: available false and conflicts", day.available === false && day.conflicts.length === 1, JSON.stringify(day));

console.log("\nFree windows");
const label = (w: { start: number; end: number }[]) => w.map(fmtRange);
check("empty day = whole opening window", label(freeWindows([], hours)).join() === "7:30 AM – 9:30 PM");
check("one booking splits the day in two", label(freeWindows([slot("03:00 PM - 04:00 PM")], hours)).join() === "7:30 AM – 3:00 PM,4:00 PM – 9:30 PM");
check("back-to-back bookings leave no gap", label(freeWindows([slot("03:00 PM - 04:00 PM"), slot("04:00 PM - 05:00 PM")], hours)).join() === "7:30 AM – 3:00 PM,5:00 PM – 9:30 PM");
check("overlapping bookings are merged", label(freeWindows([slot("03:00 PM - 05:00 PM"), slot("04:00 PM - 06:00 PM")], hours)).join() === "7:30 AM – 3:00 PM,6:00 PM – 9:30 PM");
check("booking before opening / after closing changes nothing inside", label(freeWindows([slot("06:00 AM - 07:00 AM"), slot("10:00 PM - 11:00 PM")], hours)).join() === "7:30 AM – 9:30 PM");
check("fully booked day has no free window", freeWindows([slot("07:00 AM - 10:00 PM")], hours).length === 0);
check("overlapOf is null when ranges only touch", overlapOf(slot("03:00 PM - 04:00 PM"), slot("04:00 PM - 05:00 PM")) === null);

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
