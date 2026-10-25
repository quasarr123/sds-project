/**
 * Slot availability and temporary slot locks (PDF 2).
 *
 * A booking holds its slot from the moment it is submitted:
 *   Pending Faculty / Pending HOD / Pending Superadmin  ->  PENDING   (slot locked, awaiting approval)
 *   Approved                                            ->  CONFIRMED (slot locked)
 *   Rejected / Cancelled                                ->  releases the slot
 *
 * Two bookings clash when  existing.start < requested.end  AND  existing.end > requested.start.
 * The end is exclusive, so back-to-back bookings (3-4 PM then 4-5 PM) are allowed.
 */
import type { Executor } from "../db";
import { HttpError } from "./http";
import { fmtRange, minutesToTime, timeToMinutes, type Interval } from "./time";

export type SlotState = "PENDING" | "CONFIRMED";

/** Stored booking statuses that hold a slot, and the state reported for each. */
const HOLDING: Record<string, SlotState> = {
  "Pending Faculty": "PENDING",
  "Pending HOD": "PENDING",
  "Pending Superadmin": "PENDING",
  Approved: "CONFIRMED",
};
const HOLDING_STATUSES = Object.keys(HOLDING);
const CONFIRMED_STATUSES = ["Approved"];

const MESSAGE: Record<SlotState, string> = {
  PENDING: "This slot is undergoing approval. Please wait or choose another time.",
  CONFIRMED: "This time slot is booked. Please choose another time.",
};

/** An existing booking, as exposed to the API. Never includes who booked it or why. */
export interface HeldSlot extends Interval { state: SlotState }

export interface Conflict {
  state: SlotState;
  /** The existing booking's time range, e.g. '3:00 PM – 4:00 PM'. */
  booked: string;
  /** The part of the request that actually collides, e.g. '3:30 PM – 4:00 PM'. */
  overlap: string;
  message: string;
}

/** The part two ranges share, or null if they only touch or are apart. Mirrors the SQL in heldSlots. */
export function overlapOf(a: Interval, b: Interval): Interval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return start < end ? { start, end } : null;
}

async function query(db: Executor, sql: string, params: unknown[]): Promise<any[]> {
  const [rows] = await (db as any).execute(sql, params);
  return rows;
}

/** Bookings that hold a slot at a venue on a date (all day, or only those overlapping `within`). */
async function heldSlots(
  db: Executor,
  venueId: string,
  date: string,
  opts: { within?: Interval; excludeId?: string; confirmedOnly?: boolean } = {}
): Promise<HeldSlot[]> {
  const statuses = opts.confirmedOnly ? CONFIRMED_STATUSES : HOLDING_STATUSES;
  const params: unknown[] = [venueId, date, ...statuses, opts.excludeId ?? ""];
  let overlapSql = "";
  if (opts.within) {
    overlapSql = "AND start_time < ? AND end_time > ?";
    params.push(minutesToTime(opts.within.end), minutesToTime(opts.within.start));
  }
  const rows = await query(
    db,
    `SELECT status, start_time, end_time FROM bookings
      WHERE venue_id = ? AND booking_date = ?
        AND status IN (${statuses.map(() => "?").join(",")})
        AND id <> ? ${overlapSql}
      ORDER BY start_time`,
    params
  );
  return rows.map((r) => ({
    state: HOLDING[r.status]!,
    start: timeToMinutes(r.start_time),
    end: timeToMinutes(r.end_time),
  }));
}

function toConflict(held: HeldSlot, want: Interval): Conflict {
  return {
    state: held.state,
    booked: fmtRange(held),
    overlap: fmtRange(overlapOf(held, want)!),
    message: MESSAGE[held.state],
  };
}

/** One sentence for the user. A confirmed clash wins: waiting would not help. */
export function conflictMessage(conflicts: Conflict[]): string {
  const lead = conflicts.find((c) => c.state === "CONFIRMED") ?? conflicts[0]!;
  return `${lead.message} (Overlap: ${conflicts.map((c) => c.overlap).join(", ")})`;
}

export async function findConflicts(
  db: Executor,
  venueId: string,
  date: string,
  want: Interval,
  opts: { excludeId?: string; confirmedOnly?: boolean } = {}
): Promise<Conflict[]> {
  const held = await heldSlots(db, venueId, date, { ...opts, within: want });
  return held.map((h) => toConflict(h, want));
}

/**
 * Throws HTTP 409 (with the actual overlapping ranges) if the slot is not free.
 *
 * Call it inside a transaction that has locked the venue row (SELECT ... FOR UPDATE) as its first
 * statement. InnoDB takes its snapshot at the first plain SELECT, so a plain read before the lock
 * would hide bookings that were committed while this request waited for it.
 */
export async function assertSlotFree(
  db: Executor,
  venueId: string,
  date: string,
  want: Interval,
  opts: { excludeId?: string; confirmedOnly?: boolean } = {}
): Promise<void> {
  const conflicts = await findConflicts(db, venueId, date, want, opts);
  if (conflicts.length) {
    throw new HttpError(409, conflictMessage(conflicts), { available: false, conflicts });
  }
}

/** Gaps between held slots inside the venue's opening hours. */
export function freeWindows(held: Interval[], hours: Interval): Interval[] {
  const free: Interval[] = [];
  let cursor = hours.start;
  for (const h of [...held].sort((a, b) => a.start - b.start)) {
    if (h.start > cursor) free.push({ start: cursor, end: Math.min(h.start, hours.end) });
    cursor = Math.max(cursor, h.end);
  }
  if (cursor < hours.end) free.push({ start: cursor, end: hours.end });
  return free.filter((f) => f.end > f.start);
}

const hhmm = (min: number) => minutesToTime(min).slice(0, 5);
const describe = (i: Interval) => ({ start: hhmm(i.start), end: hhmm(i.end), label: fmtRange(i) });

/**
 * Read-only view for the booking form: what is taken on a day, what is free, and (when a time
 * range is given) whether that range is available. It takes no lock, so it is advisory: the
 * booking request itself re-checks inside its transaction.
 */
export async function dayAvailability(
  db: Executor,
  venueId: string,
  date: string,
  want: Interval | null,
  hours: Interval
) {
  const [held, conflicts] = await Promise.all([
    heldSlots(db, venueId, date),
    want ? findConflicts(db, venueId, date, want) : Promise.resolve([]),
  ]);

  const day = {
    venueId,
    date,
    busy: held.map((h) => ({ state: h.state, ...describe(h) })),
    free: freeWindows(held, hours).map(describe),
  };
  if (!want) return day;

  const available = conflicts.length === 0;
  return {
    ...day,
    requested: describe(want),
    available,
    message: available ? "This slot is available." : conflictMessage(conflicts),
    conflicts,
  };
}
