import { Elysia, t } from "elysia";
import type { PoolConnection } from "mysql2/promise";
import { pool, withTx } from "../db";
import { clientIp, fail, secured } from "../plugins/auth";
import { logAudit } from "../lib/audit";
import { loadSettings } from "../lib/settings";
import { HttpError, httpFail } from "../lib/http";
import { assertSlotFree, dayAvailability } from "../lib/availability";
import { holidayCoversVenue } from "./holidays";
import {
  CANNOT_BOOK, currentStep, nextStatus, planBooking, whyCannotReview, type Step,
} from "../lib/rules";
import {
  currentYearIST, daysBetween, fmtDisplay, hhmmToMinutes, isValidDate, isWeekend,
  minutesToTime, nowIST, parseSlot, todayIST,
} from "../lib/time";

type Db = Pick<PoolConnection, "execute">;

export function bookingRow(r: any, approvals: any[] = []) {
  const o: Record<string, unknown> = {
    id: r.id,
    venueId: r.venue_id,
    venueName: r.venue_name,
    title: r.title,
    bookedBy: r.booked_by,
    userId: Number(r.user_id),
    role: r.role,
    club: r.club,
    clubId: r.club_id == null ? null : Number(r.club_id),
    bookingType: r.booking_type,
    route: r.route,
    advisorId: r.advisor_id == null ? null : Number(r.advisor_id),
    reviewDepartment: r.review_department,
    department: r.department,
    date: r.booking_date,
    timeSlot: r.time_slot,
    attendees: Number(r.attendees),
    purpose: r.purpose,
    status: r.status,
    approvedBy: r.approved_by,
    createdAt: fmtDisplay(r.created_at),
    endorsement: r.endorsement,
    stage: r.stage,
    rejectionReason: r.rejection_reason,
    hodNotes: r.hod_notes,
    cancellationReason: r.cancellation_reason,
    cancelledBy: r.cancelled_by,
    cancelledAt: fmtDisplay(r.cancelled_at),
    approvals: approvals.map((a) => ({
      step: a.step,
      decision: a.decision,
      by: a.approver_name,
      role: a.approver_role,
      note: a.note ?? "",
      at: fmtDisplay(a.created_at),
    })),
  };
  for (const k of Object.keys(o)) if (o[k] == null) delete o[k];
  return o;
}

/** Loads the approval trail for many bookings in one query. */
async function approvalsFor(db: Db | typeof pool, ids: string[]): Promise<Map<string, any[]>> {
  const map = new Map<string, any[]>();
  if (!ids.length) return map;
  const [rows] = await (db as any).query(
    `SELECT * FROM booking_approvals WHERE booking_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
    ids
  );
  for (const a of rows as any[]) {
    if (!map.has(a.booking_id)) map.set(a.booking_id, []);
    map.get(a.booking_id)!.push(a);
  }
  return map;
}

async function fetchBooking(conn: Db, id: string, forUpdate = false) {
  const [rows] = await conn.execute<any[]>(`SELECT * FROM bookings WHERE id = ?${forUpdate ? " FOR UPDATE" : ""}`, [id]);
  return rows[0];
}

async function fullBooking(conn: Db, id: string) {
  const row = await fetchBooking(conn, id);
  const trail = await approvalsFor(conn, [id]);
  return bookingRow(row, trail.get(id) ?? []);
}

async function addApproval(
  conn: Db, bookingId: string, step: Step | "auto", decision: "approved" | "rejected",
  who: { id: number | null; name: string; role: string }, note: string | null
) {
  await conn.execute(
    `INSERT INTO booking_approvals (booking_id, step, decision, approver_id, approver_name, approver_role, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [bookingId, step, decision, who.id, who.name, who.role, note, nowIST()]
  );
}

/**
 * Safety net before confirming. A pending booking already holds its slot, so nothing new can
 * overlap it; this only catches older requests that were made before slot locking existed.
 * The caller has already locked the venue row (see the approval handler).
 */
async function assertStillFree(conn: Db, b: any) {
  const slot = parseSlot(b.time_slot);
  if (!slot) return;
  await assertSlotFree(conn, b.venue_id, String(b.booking_date), slot, { excludeId: b.id, confirmedOnly: true });
}

const STAGE: Record<string, string> = {
  "Pending Faculty": "Level 1: Club Faculty Advisor Review",
  "Pending HOD": "HOD Review",
  "Pending Superadmin": "Superadmin Review",
  Approved: "Completed Approval",
};

export const bookingRoutes = new Elysia({ prefix: "/bookings" })

  // ── List (scoped by role) ────────────────────────────────────────────────
  .get(
    "/",
    secured(null, async (_ctx, user) => {
      let sql = "SELECT * FROM bookings";
      let params: any[] = [];
      if (user.role === "student") {
        sql += " WHERE user_id = ?";
        params = [user.id];
      } else if (user.role === "faculty") {
        // Limited view: own bookings + club bookings this faculty advises
        sql += " WHERE user_id = ? OR advisor_id = ?";
        params = [user.id, user.id];
      } else if (user.role === "hod") {
        // Own department only
        sql += ` WHERE review_department = ? OR department = ?
                    OR venue_id IN (SELECT id FROM venues WHERE department = ?)`;
        params = [user.department, user.department, user.department];
      }
      sql += " ORDER BY created_at DESC, seq DESC";
      const [rows] = await pool.execute<any[]>(sql, params);
      const trail = await approvalsFor(pool, rows.map((r) => r.id));
      return rows.map((r) => bookingRow(r, trail.get(r.id) ?? []));
    })
  )

  // ── Availability (read-only, for the booking form) ───────────────────────
  // GET /bookings/availability?venueId=..&date=YYYY-MM-DD[&timeSlot=03:30 PM - 04:30 PM]
  // Without timeSlot: what is taken / free that day. With it: also whether that range is available.
  .get(
    "/availability",
    secured(null, async (ctx) => {
      const { venueId, date, timeSlot } = ctx.query as { venueId: string; date: string; timeSlot?: string };
      if (!isValidDate(date)) return fail(ctx, 400, "Please choose a valid date.");
      const want = timeSlot ? parseSlot(timeSlot) : null;
      if (timeSlot && !want) return fail(ctx, 400, "Invalid time slot.");

      const [venues] = await pool.execute<any[]>("SELECT id FROM venues WHERE id = ?", [venueId]);
      if (!venues[0]) return fail(ctx, 404, "Venue not found.");

      const settings = await loadSettings();
      const hours = {
        start: hhmmToMinutes(settings.dailyOpeningTime) ?? 0,
        end: hhmmToMinutes(settings.dailyClosingTime) ?? 24 * 60,
      };
      return dayAvailability(pool, venueId, date, want, hours);
    }),
    {
      query: t.Object({
        venueId: t.String({ minLength: 1, maxLength: 40 }),
        date: t.String(),
        timeSlot: t.Optional(t.String({ maxLength: 80 })),
      }),
    }
  )

  // ── Create ───────────────────────────────────────────────────────────────
  .post(
    "/",
    secured(["student", "faculty", "hod", "superadmin"], async (ctx, user) => {
      if (CANNOT_BOOK[user.role]) return fail(ctx, 403, CANNOT_BOOK[user.role]!);

      const b = ctx.body as any;
      const title = String(b.title).trim();
      const purpose = String(b.purpose).trim();
      if (!title || !purpose) return fail(ctx, 400, "Please fill in all mandatory booking fields.");
      if (!isValidDate(b.date)) return fail(ctx, 400, "Please choose a valid reservation date.");

      const slot = parseSlot(b.timeSlot);
      if (!slot) return fail(ctx, 400, "Invalid time slot.");

      const clubId = b.clubId === undefined || b.clubId === null || b.clubId === "" ? null : Number(b.clubId);
      if (clubId !== null && !Number.isInteger(clubId)) return fail(ctx, 400, "Invalid club selected.");
      if (user.role === "faculty" && b.bookingType && !["extra_class", "other"].includes(b.bookingType)) {
        return fail(ctx, 400, "Booking purpose must be 'extra_class' or 'other'.");
      }

      const settings = await loadSettings();

      try {
        return await withTx(async (conn) => {
          // Lock the venue row: concurrent requests for this venue queue up here.
          const [vrows] = await conn.execute<any[]>("SELECT * FROM venues WHERE id = ? FOR UPDATE", [b.venueId]);
          const venue = vrows[0];
          if (!venue) throw new HttpError(400, "Selected venue does not exist.");

          let club: any = null;
          if (clubId !== null && user.role === "student") {
            const [cr] = await conn.execute<any[]>(
              `SELECT c.*, u.name AS advisor_name FROM clubs c
                 LEFT JOIN users u ON u.id = c.faculty_advisor_id WHERE c.id = ?`, [clubId]);
            club = cr[0] ?? null;
          }

          // Who must approve this? (also rejects roles/venues that are not allowed)
          const plan = planBooking(
            user,
            { name: venue.name, department: venue.department, category: venue.category },
            { clubId: user.role === "student" ? clubId : null, bookingType: b.bookingType },
            club
          );

          if (venue.status !== "Available") {
            throw new HttpError(400, `${venue.name} is currently ${venue.status.toLowerCase()} and cannot be booked.`);
          }

          const attendees = Math.max(1, Number(b.attendees) || (user.role === "student" ? 50 : 60));
          if (attendees > Number(venue.capacity)) {
            throw new HttpError(400, `${venue.name} holds at most ${venue.capacity} attendees.`);
          }

          const today = todayIST();
          const ahead = daysBetween(today, b.date);
          if (ahead < 0) throw new HttpError(400, "Reservation date cannot be in the past.");
          if (ahead < settings.minLeadTimeDays) {
            throw new HttpError(400, `Bookings need at least ${settings.minLeadTimeDays} day(s) of lead time.`);
          }
          if (ahead > settings.maxAdvanceDays) {
            throw new HttpError(400, `Bookings can be made at most ${settings.maxAdvanceDays} days in advance.`);
          }
          if (!settings.allowWeekendBooking && isWeekend(b.date)) {
            throw new HttpError(400, "Weekend bookings are currently disabled.");
          }
          const open = hhmmToMinutes(settings.dailyOpeningTime);
          const close = hhmmToMinutes(settings.dailyClosingTime);
          if (open != null && slot.start < open) {
            throw new HttpError(400, `Venues open at ${settings.dailyOpeningTime}; choose a later slot.`);
          }
          if (close != null && slot.end > close) {
            throw new HttpError(400, `Venues close at ${settings.dailyClosingTime}; choose an earlier slot.`);
          }

          const [hrows] = await conn.execute<any[]>(
            "SELECT * FROM holidays WHERE is_strict_block = 1 AND start_date <= ? AND end_date >= ?",
            [b.date, b.date]
          );
          const blocked = hrows.find((h) => holidayCoversVenue(h.affected_venues, venue));
          if (blocked) throw new HttpError(409, `${b.date} is blocked: ${blocked.title}.`);

          // Every request, including faculty extra classes, must pass the availability check.
          // The venue row is locked above, so a competing request waits here and then sees this
          // booking (pending bookings block too). The loser gets HTTP 409.
          await assertSlotFree(conn, venue.id, b.date, slot);

          const [ins] = await conn.execute<any>(
            `INSERT INTO bookings
               (id, venue_id, venue_name, title, user_id, booked_by, role, club, department,
                booking_date, time_slot, attendees, purpose, status, approved_by, endorsement, stage, created_at,
                booking_type, route, club_id, advisor_id, review_department, start_time, end_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `TMP-${crypto.randomUUID()}`.slice(0, 30), venue.id, venue.name, title.slice(0, 255),
              user.id, user.name, user.role, plan.clubName, user.department || null,
              b.date, b.timeSlot, attendees, purpose, plan.status, plan.waitingText, plan.endorsement,
              STAGE[plan.status], nowIST(),
              plan.bookingType, plan.route, plan.clubId, plan.advisorId, plan.reviewDepartment,
              minutesToTime(slot.start), minutesToTime(slot.end),
            ]
          );
          const seq = ins.insertId;
          const id = `BK-${currentYearIST()}-${String(seq).padStart(3, "0")}`;
          await conn.execute("UPDATE bookings SET id = ? WHERE seq = ?", [id, seq]);

          if (plan.route === "auto") {
            await addApproval(conn, id, "auto", "approved", { id: null, name: "System (auto-approved)", role: "system" },
              "Faculty extra class: availability confirmed");
          }

          await logAudit({
            userId: user.id, actor: user.name, role: user.role, action: "BOOKING_SUBMITTED",
            target: `${id} (${title})`, ip: clientIp(ctx),
            details: `Submitted reservation for ${venue.name} on ${b.date} (${plan.route} route, status ${plan.status}).`,
          }, conn);
          if (plan.route === "auto") {
            await logAudit({
              userId: user.id, actor: user.name, role: user.role, action: "BOOKING_AUTO_APPROVED",
              target: id, ip: clientIp(ctx), details: "Faculty extra class auto-approved after availability check.",
            }, conn);
          }

          return await fullBooking(conn, id);
        });
      } catch (e) {
        if (e instanceof HttpError) return httpFail(ctx, e);
        throw e;
      }
    }),
    {
      body: t.Object({
        venueId: t.String({ minLength: 1, maxLength: 40 }),
        title: t.String({ minLength: 1, maxLength: 255 }),
        clubId: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        bookingType: t.Optional(t.String({ maxLength: 20 })),
        date: t.String(),
        timeSlot: t.String({ minLength: 1, maxLength: 80 }),
        attendees: t.Optional(t.Union([t.Number(), t.String()])),
        purpose: t.String({ minLength: 1, maxLength: 5000 }),
      }),
    }
  )

  // ── Approve / reject the booking's current step ──────────────────────────
  // Any status other than "Rejected" means "approve": the server moves the booking
  // to the next step of its own route, so the client cannot skip a step.
  .patch(
    "/:id/status",
    secured(["faculty", "hod", "superadmin"], async (ctx, user) => {
      const body = ctx.body as any;
      const reject = body.status === "Rejected";
      const note = (s?: string) => (s ?? "").trim().slice(0, 2000);

      try {
        return await withTx(async (conn) => {
          const b = await fetchBooking(conn, ctx.params.id, true);
          if (!b) throw new HttpError(404, "Booking not found.");

          // Lock the venue first (as booking creation does) so the availability re-check on confirm
          // sees every booking committed so far.
          const [vr] = await conn.execute<any[]>("SELECT department FROM venues WHERE id = ? FOR UPDATE", [b.venue_id]);
          const problem = whyCannotReview(user, b, vr[0]?.department ?? null, reject ? "reject" : "approve");
          if (problem) throw new HttpError(problem.startsWith("This booking is already") ? 409 : 403, problem);

          const step = currentStep(b.status)!;
          const from: string = b.status;
          const who = { id: user.id, name: user.name, role: user.role };

          let to: string, approvedBy: string, stage: string;
          let endorsement: string | null = b.endorsement;
          let hodNotes: string | null = b.hod_notes;
          let rejection: string | null = null;

          if (reject) {
            to = "Rejected";
            const label = step === "advisor" && user.role === "faculty" ? "Club Faculty Advisor "
              : user.role === "hod" ? "HOD " : user.role === "superadmin" ? "Superadmin " : "";
            approvedBy = `Rejected by ${label}${user.name}`;
            stage = user.role === "faculty" ? "Rejected by Faculty Advisor"
              : user.role === "hod" ? "Rejected by Department Head" : "Rejected";
            rejection = note(body.rejectionReason) || note(body.hodNotes) || note(body.endorsement) ||
              "Request declined during review.";
            await addApproval(conn, b.id, step, "rejected", who, rejection);
          } else {
            to = nextStatus(b.route, from);
            if (to === "Approved") await assertStillFree(conn, b);
            let n: string;
            if (step === "advisor") {
              n = note(body.endorsement) || "Approved by Club Faculty Advisor.";
              endorsement = n;
              approvedBy = `Club Faculty Advisor approved: ${user.name}. Awaiting Superadmin`;
            } else if (step === "hod") {
              n = note(body.hodNotes) || "Academic schedule cleared.";
              hodNotes = n;
              approvedBy = user.role === "superadmin"
                ? `${user.name} (Superadmin Clearance)`
                : `HOD approved: ${user.name} (${user.department})`;
            } else {
              n = note(body.endorsement) || note(body.hodNotes) || "Final clearance granted.";
              approvedBy = `${user.name} (Superadmin Clearance)`;
            }
            stage = STAGE[to]!;
            await addApproval(conn, b.id, step, "approved", who, n);
          }

          await conn.execute(
            `UPDATE bookings SET status = ?, approved_by = ?, stage = ?, endorsement = ?, hod_notes = ?,
                                 rejection_reason = ? WHERE id = ?`,
            [to, approvedBy, stage, endorsement, hodNotes, rejection, b.id]
          );

          await logAudit({
            userId: user.id, actor: user.name, role: user.role,
            action: `BOOKING_${to.toUpperCase().replace(/\s+/g, "_")}`,
            target: b.id, ip: clientIp(ctx), status: reject ? "WARNING" : "SUCCESS",
            details: `Status changed from "${from}" to "${to}". Updated by ${user.name} (${user.role}).`,
          }, conn);

          return await fullBooking(conn, b.id);
        });
      } catch (e) {
        if (e instanceof HttpError) return httpFail(ctx, e);
        throw e;
      }
    }),
    {
      body: t.Object({
        status: t.String({ maxLength: 30 }),
        endorsement: t.Optional(t.String()),
        rejectionReason: t.Optional(t.String()),
        hodNotes: t.Optional(t.String()),
      }),
    }
  )

  // ── Superadmin cancellation (mandatory reason) ───────────────────────────
  .post(
    "/:id/cancel",
    secured(["superadmin"], async (ctx, user) => {
      const reason = String((ctx.body as any).reason ?? "").trim();
      if (reason.length < 15) {
        return fail(ctx, 400, "Please provide a substantive reason (at least 15 characters).");
      }
      try {
        return await withTx(async (conn) => {
          const b = await fetchBooking(conn, ctx.params.id, true);
          if (!b) throw new HttpError(404, "Booking not found.");
          if (b.status === "Cancelled" || b.status === "Rejected") {
            throw new HttpError(409, `This booking is already ${b.status.toLowerCase()}.`);
          }
          await conn.execute(
            `UPDATE bookings SET status = 'Cancelled', stage = 'Cancelled', cancellation_reason = ?,
                                 cancelled_by = ?, cancelled_at = ? WHERE id = ?`,
            [reason.slice(0, 2000), user.name, nowIST(), b.id]
          );
          await logAudit({
            userId: user.id, actor: user.name, role: user.role, action: "BOOKING_CANCELLED",
            target: b.id, ip: clientIp(ctx), status: "WARNING",
            details: `Superadmin cancelled booking. Reason: "${reason}".`,
          }, conn);
          return await fullBooking(conn, b.id);
        });
      } catch (e) {
        if (e instanceof HttpError) return httpFail(ctx, e);
        throw e;
      }
    }),
    { body: t.Object({ reason: t.String({ maxLength: 2000 }) }) }
  );
