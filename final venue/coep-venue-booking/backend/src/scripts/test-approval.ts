/**
 * End-to-end check of the approval rules (PDF 1) against a RUNNING server.
 *   bun run dev            (in another terminal)
 *   bun run test:approval
 * It creates a few test bookings on a free date; cancel them afterwards from the Superadmin screen if you like.
 */
import { check, day, finish, login } from "./_test-utils";

// A date well inside the booking window, clear of the demo holidays/bookings.
// Booked slots stay locked, so to re-run on the same day pick another date: TEST_DAY_OFFSET=20 bun run test:approval
const D = day(Number(process.env.TEST_DAY_OFFSET ?? 12));
let slotN = 0;
const slots = ["08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM", "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM"];
const nextSlot = () => slots[slotN++ % slots.length]!;
const mk = (venueId: string, extra: Record<string, unknown> = {}) =>
  ({ venueId, title: "Rule test", date: D, timeSlot: nextSlot(), attendees: 20, purpose: "automated rule test", ...extra });

const student = await login("deshmukha21.comp@coep.ac.in");
const faculty = await login("spatil.comp@coep.ac.in");        // id 201
const advisor2 = await login("nbdhokey.meta@coep.ac.in");     // id 205
const hod = await login("hod.comp@coep.ac.in");
const admin = await login("registrar@coeptech.ac.in");

console.log("\nBooking routes");
let r = await student("POST", "/bookings", mk("v-comp-hall"));
check("Student + own-department venue → Pending HOD", r.status === 200 && r.data.status === "Pending HOD" && r.data.route === "hod", JSON.stringify(r.data));
const studentDeptBooking = r.data.id;

r = await student("POST", "/bookings", mk("v-mech-hall"));
check("Student + another department's venue → refused", r.status === 400, JSON.stringify(r.data));

r = await student("POST", "/bookings", mk("v-auditorium"));
check("Student + auditorium → Pending Superadmin", r.status === 200 && r.data.status === "Pending Superadmin" && r.data.route === "superadmin", JSON.stringify(r.data));

r = await student("POST", "/bookings", mk("v-boatclub"));
check("Student + club venue without a club → refused", r.status === 400, JSON.stringify(r.data));

r = await student("POST", "/bookings", mk("v-boatclub", { clubId: 2 }));
check("Student + club venue + club → Pending Faculty (advisor first)", r.status === 200 && r.data.status === "Pending Faculty" && r.data.route === "club", JSON.stringify(r.data));
const clubBooking = r.data.id;

r = await student("POST", "/bookings", mk("v-auditorium", { clubId: 1 }));
check("Student club event in auditorium → club route (advisor, then superadmin)", r.status === 200 && r.data.route === "club" && r.data.status === "Pending Faculty", JSON.stringify(r.data));
const clubAudi = r.data.id;

const extraSlot = nextSlot();
r = await faculty("POST", "/bookings", { ...mk("v-comp-hall"), timeSlot: extraSlot, bookingType: "extra_class" });
check("Faculty extra class → auto-approved", r.status === 200 && r.data.status === "Approved" && r.data.route === "auto", JSON.stringify(r.data));
r = await faculty("POST", "/bookings", { ...mk("v-comp-hall"), timeSlot: extraSlot, bookingType: "extra_class" });
check("Faculty extra class still hits the conflict check (409)", r.status === 409, JSON.stringify(r.data));

r = await faculty("POST", "/bookings", { ...mk("v-comp-hall"), bookingType: "other" });
check("Faculty other purpose → Pending HOD", r.status === 200 && r.data.status === "Pending HOD", JSON.stringify(r.data));
const facultyOther = r.data.id;

r = await hod("POST", "/bookings", mk("v-comp-hall"));
check("HOD cannot request a booking (403)", r.status === 403, JSON.stringify(r.data));
r = await admin("POST", "/bookings", mk("v-comp-hall"));
check("Superadmin cannot request a booking (403)", r.status === 403, JSON.stringify(r.data));

console.log("\nApprovals");
r = await student("PATCH", `/bookings/${studentDeptBooking}/status`, { status: "Approved" });
check("Student cannot approve (403)", r.status === 403, JSON.stringify(r.data));
r = await hod("PATCH", `/bookings/${studentDeptBooking}/status`, { status: "Approved" });
check("HOD approves own-department student request → Approved", r.status === 200 && r.data.status === "Approved", JSON.stringify(r.data));
r = await hod("PATCH", `/bookings/${clubBooking}/status`, { status: "Approved" });
check("HOD cannot act on a club request waiting for the advisor (403)", r.status === 403, JSON.stringify(r.data));

r = await faculty("PATCH", `/bookings/${clubBooking}/status`, { status: "Pending HOD" });
check("Faculty who is NOT the club's advisor cannot approve (403)", r.status === 403, JSON.stringify(r.data));
r = await admin("PATCH", `/bookings/${clubBooking}/status`, { status: "Approved" });
check("Superadmin cannot skip the club advisor (403)", r.status === 403, JSON.stringify(r.data));
r = await advisor2("PATCH", `/bookings/${clubBooking}/status`, { status: "Approved", endorsement: "ok" });
check("Club advisor approves → Pending Superadmin (not yet confirmed)", r.status === 200 && r.data.status === "Pending Superadmin", JSON.stringify(r.data));
r = await advisor2("PATCH", `/bookings/${clubBooking}/status`, { status: "Approved" });
check("Advisor cannot act again once the booking moved on (403)", r.status === 403, JSON.stringify(r.data));
r = await admin("PATCH", `/bookings/${clubBooking}/status`, { status: "Approved" });
check("Superadmin approves → Approved, trail shows both approvers", r.status === 200 && r.data.status === "Approved" && r.data.approvals?.length === 2, JSON.stringify(r.data));

r = await admin("PATCH", `/bookings/${clubAudi}/status`, { status: "Rejected", rejectionReason: "test reject" });
check("Superadmin can reject at any pending step", r.status === 200 && r.data.status === "Rejected", JSON.stringify(r.data));
r = await hod("PATCH", `/bookings/${facultyOther}/status`, { status: "Rejected", rejectionReason: "clash with lecture" });
check("HOD rejects faculty request", r.status === 200 && r.data.status === "Rejected", JSON.stringify(r.data));

console.log("\nVisibility");
r = await student("GET", "/bookings");
check("Student sees only own bookings", r.status === 200 && r.data.every((b: any) => b.bookedBy.startsWith("Aarav")), "");
r = await faculty("GET", "/bookings");
check("Faculty sees limited set (own + advised clubs)", r.status === 200 && r.data.every((b: any) => b.userId === 201 || b.advisorId === 201), "");
r = await hod("GET", "/bookings");
check("HOD sees own department only", r.status === 200 && r.data.every((b: any) => [b.department, b.reviewDepartment].includes("Computer Engineering") || b.venueName?.includes("Computer")), "");
r = await admin("GET", "/bookings");
check("Superadmin sees all departments", r.status === 200 && new Set(r.data.map((b: any) => b.department)).size > 2, "");
r = await student("GET", "/admin/users");
check("Only superadmin can manage users (student → 403)", r.status === 403, "");
r = await admin("GET", "/admin/users");
check("Superadmin can list users", r.status === 200 && r.data.length >= 10, "");

finish();
