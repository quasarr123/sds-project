/**
 * End-to-end check of availability, slot locks and simultaneous requests (PDF 2) against a RUNNING server.
 *   bun run dev                   (in another terminal)
 *   bun run test:availability
 * It picks a free future date at random, books on Computer Engineering's seminar hall, and cancels
 * everything it created when it finishes.
 */
import { BASE, check, day, finish, login, type Api } from "./_test-utils";

const VENUE = "v-comp-hall";
const PENDING_MSG = "This slot is undergoing approval. Please wait or choose another time.";
const BOOKED_MSG = "This time slot is booked. Please choose another time.";

const student = await login("deshmukha21.comp@coep.ac.in");
const faculty = await login("spatil.comp@coep.ac.in");
const hod = await login("hod.comp@coep.ac.in");
const admin = await login("registrar@coeptech.ac.in");

const created: string[] = [];
let D = "";

const book = async (who: Api, timeSlot: string, extra: Record<string, unknown> = {}, date = D) => {
  const r = await who("POST", "/bookings", {
    venueId: VENUE, title: "Availability test", date, timeSlot, attendees: 20,
    purpose: "automated availability test", ...extra,
  });
  if (r.status === 200) created.push(r.data.id);
  return r;
};
const extraClass = (timeSlot: string) => book(faculty, timeSlot, { bookingType: "extra_class" });
const avail = (who: Api, timeSlot?: string, date = D) =>
  who("GET", `/bookings/availability?${new URLSearchParams({ venueId: VENUE, date, ...(timeSlot ? { timeSlot } : {}) })}`);

// ── Find a free date (random, so repeated runs do not collide) ───────────────
const offsets = Array.from({ length: 48 }, (_, i) => i + 10).sort(() => Math.random() - 0.5);
let first: Awaited<ReturnType<typeof book>> | undefined;
for (const n of offsets) {
  D = day(n);
  if ((await avail(student)).data.busy?.length) continue;
  first = await book(student, "03:00 PM - 04:00 PM");
  if (first.status === 200) break;       // anything else: holiday / weekend rule, try another day
}
if (!first || first.status !== 200) throw new Error("Could not find a free date to run the test on.");
console.log(`Test date: ${D}`);

console.log("\nTemporary slot lock");
check("Valid request → Pending HOD, slot locked", first.data.status === "Pending HOD", JSON.stringify(first.data));
let r = await avail(student, "03:30 PM - 04:30 PM");
check("Availability: 3:30-4:30 PM is not available", r.status === 200 && r.data.available === false, JSON.stringify(r.data));
check("…reported as PENDING with the actual overlap 3:30-4:00 PM",
  r.data.conflicts?.[0]?.state === "PENDING" && r.data.conflicts[0].overlap === "3:30 PM – 4:00 PM", JSON.stringify(r.data.conflicts));
r = await avail(student, "04:00 PM - 04:30 PM");
check("Availability: 4:00-4:30 PM is available", r.data.available === true, JSON.stringify(r.data));

r = await extraClass("03:30 PM - 04:30 PM");
check("Overlapping request is refused with 409", r.status === 409, JSON.stringify(r.data));
check("…with the 'undergoing approval' message and the actual overlap",
  r.data.message?.includes(PENDING_MSG) && r.data.message.includes("3:30 PM – 4:00 PM"), r.data.message);
check("…and the structured conflicts for the UI", r.data.available === false && r.data.conflicts?.length === 1, JSON.stringify(r.data));

console.log("\nAdjacent slots and confirmed bookings");
const extra = await extraClass("04:00 PM - 05:00 PM");
check("Adjacent slot 4:00-5:00 PM is allowed (extra class auto-confirms)", extra.status === 200 && extra.data.status === "Approved", JSON.stringify(extra.data));
r = await book(student, "04:30 PM - 05:30 PM");
check("Overlap with a confirmed booking → 409 'time slot is booked'", r.status === 409 && r.data.message?.includes(BOOKED_MSG), JSON.stringify(r.data));
check("…showing the actual overlap 4:30-5:00 PM", r.data.message?.includes("4:30 PM – 5:00 PM"), r.data.message);

r = await hod("PATCH", `/bookings/${first.data.id}/status`, { status: "Approved" });
check("Approving the pending booking confirms it", r.status === 200 && r.data.status === "Approved", JSON.stringify(r.data));
r = await avail(student, "03:00 PM - 04:00 PM");
check("Confirmed booking keeps the slot locked (CONFIRMED)", r.data.available === false && r.data.conflicts?.[0]?.state === "CONFIRMED", JSON.stringify(r.data));

console.log("\nRelease on reject / cancel");
const six = await book(student, "06:00 PM - 07:00 PM");
check("Pending request at 6-7 PM created", six.status === 200, JSON.stringify(six.data));
r = await book(student, "06:00 PM - 07:00 PM");
check("A second request for the same slot is refused while pending", r.status === 409, JSON.stringify(r.data));
await hod("PATCH", `/bookings/${six.data.id}/status`, { status: "Rejected", rejectionReason: "test reject" });
r = await avail(student, "06:00 PM - 07:00 PM");
check("Rejected request releases the slot", r.data.available === true, JSON.stringify(r.data));
r = await book(student, "06:00 PM - 07:00 PM");
check("…and it can be requested again", r.status === 200, JSON.stringify(r.data));

r = await admin("POST", `/bookings/${extra.data.id}/cancel`, { reason: "Automated test: cancel releases the slot" });
check("Superadmin cancels the confirmed 4-5 PM booking", r.status === 200 && r.data.status === "Cancelled", JSON.stringify(r.data));
r = await extraClass("04:00 PM - 05:00 PM");
check("Cancelled booking releases the slot (re-booked as extra class)", r.status === 200 && r.data.status === "Approved", JSON.stringify(r.data));

console.log("\nSimultaneous requests for one slot");
const racers = await Promise.all([
  ...Array.from({ length: 5 }, () => extraClass("08:00 AM - 09:00 AM")),
  ...Array.from({ length: 5 }, () => book(student, "08:00 AM - 09:00 AM")),
]);
const won = racers.filter((x) => x.status === 200).length;
const lost = racers.filter((x) => x.status === 409).length;
check("Exactly one of 10 simultaneous requests wins", won === 1, `won=${won}`);
check("The other 9 get 409 Conflict (no 500s)", lost === 9, racers.map((x) => x.status).join(","));
r = await avail(student, "08:00 AM - 09:00 AM");
check("Only one booking holds that slot", r.data.conflicts?.length === 1, JSON.stringify(r.data.conflicts));

console.log("\nAvailability endpoint");
r = await avail(student);
check("Day view lists busy and free ranges", r.status === 200 && r.data.busy?.length >= 3 && r.data.free?.length >= 1, JSON.stringify(r.data));
check("Day view does not reveal who booked or why", !JSON.stringify(r.data).match(/Availability test|automated|Aarav|Patil/i), JSON.stringify(r.data));
check("Invalid date → 400", (await avail(student, undefined, "2026-13-45")).status === 400);
check("Invalid time slot → 400", (await avail(student, "whenever")).status === 400);
check("Unknown venue → 404", (await student("GET", `/bookings/availability?venueId=nope&date=${D}`)).status === 404);
const anon = await fetch(`${BASE}/bookings/availability?venueId=${VENUE}&date=${D}`);
check("Not logged in → 401", anon.status === 401, String(anon.status));

// Leave the database as we found it.
for (const id of created) {
  await admin("POST", `/bookings/${id}/cancel`, { reason: "Automated test cleanup" });
}
console.log(`\nCleaned up ${created.length} test booking(s).`);
finish();
