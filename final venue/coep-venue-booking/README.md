# COEP Venue Booking System

A web portal for booking auditoriums, seminar halls and other venues at COEP Tech.
Students, faculty, HODs and the registrar (superadmin) each get their own dashboard and approval step.

| Part | Tech | Folder |
|------|------|--------|
| Frontend | React + Vite | `frontend/` |
| Backend (API) | Bun + Elysia | `backend/` |
| Database | MySQL / MariaDB (local or Aiven) | `db/` |

## Folder structure

```
coep-venue-booking/
├── frontend/
│   ├── index.html
│   ├── vite.config.js          dev server on :3000, forwards /api to the backend
│   └── src/
│       ├── main.jsx            app entry point
│       ├── App.jsx             routing + loads data from the API
│       ├── pages/              one file per screen (login, dashboards, settings...)
│       ├── components/         reusable UI (common/, layout/, auth/, booking/ = slot picker + availability notice)
│       ├── hooks/              useSlotAvailability: live availability check for the booking forms
│       ├── services/client.js  every call to the backend lives here
│       ├── config/             default settings shape
│       └── assets/             images
├── backend/
│   ├── .env                    your DB credentials (not committed)
│   ├── .env.example            template for .env
│   ├── certs/ca.pem            CA certificate for the hosted database
│   └── src/
│       ├── index.ts            starts the server
│       ├── config.ts           reads .env
│       ├── db.ts               database connection pool
│       ├── routes/             API endpoints (auth, venues, clubs, bookings, admin, holidays, settings, audit)
│       ├── plugins/auth.ts     session + role checks
│       ├── lib/                approval rules (rules.ts), availability + slot locks (availability.ts), schema upgrade (migrate.ts), audit, settings, time helpers
│       └── scripts/init-db.ts  creates tables and demo data
└── db/
    ├── schema.sql              table definitions
    └── backups/                SQL dumps of the demo database
```

## Setup (one time)

1. Install [Bun](https://bun.sh) (1.1 or newer).
2. From the project root:
   ```bash
   bun install
   ```
3. Check `backend/.env`. If it does not exist, copy `backend/.env.example` to `backend/.env` and fill in the database details:
   - Local MySQL/MariaDB: `DB_HOST=localhost`, your `DB_USER` / `DB_PASSWORD`, `DB_NAME=venue_booking`.
   - Hosted database (Aiven): the host, port, user, password and database name from the Aiven console. Keep its CA certificate in `backend/certs/ca.pem`.
4. Create the tables and demo data:
   ```bash
   bun run db:init       # safe to repeat: skips demo data if users already exist
   bun run db:reset      # drops every table and rebuilds from scratch
   ```

On Windows you can double-click `setup-windows.bat` instead of steps 2 and 4.

## Run

```bash
bun run dev
```

- Web app: http://localhost:3000
- API health check: http://localhost:3001/api/health (should show `"db": true`)

On Windows: double-click `start-project.bat`.
To run the two halves separately: `bun run dev:backend` and `bun run dev:frontend`.

## Demo accounts

Password for all accounts: `Coep@1234` (or whatever `DEMO_PASSWORD` is in `backend/.env`).

| Role | Login |
|------|-------|
| Student | `deshmukha21.comp@coep.ac.in` (or MIS number `112103045`) |
| Faculty | `spatil.comp@coep.ac.in` |
| HOD | `hod.comp@coep.ac.in` |
| Superadmin | `registrar@coeptech.ac.in` |

Choose the matching role on the first screen, then sign in.

## How approval works (enforced by the server)

| Who books | What they book | Who approves |
|-----------|----------------|--------------|
| Student | A venue in their own department | Departmental HOD |
| Student | Auditorium / Mini Auditorium / Academic Complex (central venue) | Superadmin |
| Student | A club event, or a club venue | Club Faculty Advisor first, then Superadmin |
| Faculty | Extra class | Auto-approved (after the availability check) |
| Faculty | Any other purpose | Relevant HOD |
| HOD | - | Not allowed to request; reviews eligible requests only |
| Superadmin | - | Does not request; can review, approve or cancel any booking |

* A venue's **category** (`department`, `central`, `club`) decides the route. Superadmin sets it under *Users, Venues & Clubs*.
* A club request is confirmed only after **both** the advisor and the Superadmin approve. Superadmin cannot skip the advisor.
* Any reviewer in the chain can reject. Only the Superadmin can cancel a booking (reason of at least 15 characters).
* Who approved what is stored in `booking_approvals` and shown on each request's timeline. Students see their own requests,
  faculty see their own plus the clubs they advise, HODs see their department, the Superadmin sees everything.
* Every request also has to pass the availability check, blocked dates, capacity, opening hours and the lead-time / advance-window / weekend rules from Settings.

The API reports availability as `PENDING` / `CONFIRMED`; the stored booking statuses are below.

Statuses: `Pending Faculty` (waiting for the club advisor), `Pending HOD`, `Pending Superadmin`, `Approved` (confirmed), `Rejected`, `Cancelled`.

## How availability works (enforced by the server)

Every request must pass the availability check, including faculty extra classes. A request holds its slot **from the moment it is submitted**, so two people cannot both be waiting for the same time.

| Booking status | Holds the slot? | Message to a second requester |
|----------------|-----------------|-------------------------------|
| Pending Faculty / Pending HOD / Pending Superadmin (`PENDING`) | Yes | "This slot is undergoing approval. Please wait or choose another time." |
| Approved (`CONFIRMED`) | Yes | "This time slot is booked. Please choose another time." |
| Rejected / Cancelled | No, the slot is released | They can request it again |

* **Overlap rule:** `existing.start_time < requested.end_time AND existing.end_time > requested.start_time`. Back-to-back bookings (3-4 PM then 4-5 PM) are allowed. A clash reports the actual overlap, e.g. existing 3:00-4:00 PM and request 3:30-4:30 PM gives "Overlap: 3:30 PM – 4:00 PM".
* **Simultaneous requests:** booking creation runs in one transaction and locks the venue row (`SELECT ... FOR UPDATE`) before checking for overlaps. A competing request waits, re-checks, and gets **HTTP 409** if the slot was taken. The availability check and the insert use the same connection.
* **Confirming a booking** re-checks under the same venue lock (a safety net for requests made before slot locking existed).
* A waiting user's request is never submitted automatically when another request is rejected. They retry themselves.
* The time range is stored in `bookings.start_time` / `end_time` (parsed from `time_slot`). The upgrade adds the columns and fills them for old bookings.
* **Booking form:** after choosing venue and date, the form shows what is taken and free that day, then whether the chosen time is available. Slots can be a ready-made slot or a custom from/to time.

`GET /api/bookings/availability?venueId=..&date=YYYY-MM-DD[&timeSlot=03:30 PM - 04:30 PM]` returns `busy` and `free` ranges for the day and, when `timeSlot` is given, `available`, `message` and `conflicts`. It never reveals who booked a slot or why. It is advisory (no lock); the booking request itself is the source of truth.

### Existing database

Starting the server (or `bun run db:init`) upgrades an existing database automatically: it adds the new columns/tables
(including `bookings.start_time` / `end_time`), classifies the demo venues, creates demo clubs and back-fills old bookings. Nothing is deleted.

### Test the rules

From `backend/`:

* `bun run test:availability-logic` - no server or database needed; checks overlaps, statuses, messages and free windows.
* `bun run test:approval` - with the server running; ~27 checks of the approval table above against the live API.
* `bun run test:availability` - with the server running; checks slot locks, 409 conflicts, release on reject/cancel and 10 simultaneous requests for one slot. It picks a random free date and cancels what it created.

Booked slots stay locked, so to re-run `test:approval` on the same day use another date: `TEST_DAY_OFFSET=20 bun run test:approval`.

## API overview

All routes start with `/api` and need a logged-in session cookie, except login and health.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` |
| Venues / clubs | `GET /venues`, `GET /clubs`, `GET /departments` |
| Bookings | `GET /bookings`, `GET /bookings/availability`, `POST /bookings`, `PATCH /bookings/:id/status`, `POST /bookings/:id/cancel` |
| Holidays | `GET /holidays`, `POST /holidays` (superadmin), `DELETE /holidays/:id` (superadmin) |
| Settings | `GET /settings`, `PUT /settings` (superadmin) |
| Audit log | `GET /audit-logs` (superadmin) |
| Manage (superadmin) | `GET/POST /admin/users`, `PUT /admin/users/:id`, `POST /admin/venues`, `PUT /admin/venues/:id`, `POST /admin/clubs`, `PUT /admin/clubs/:id` |

## Production

```bash
bun run build     # builds the frontend into frontend/dist
bun run start     # one server on :3001 serves the API and the built frontend
```

Set `COOKIE_SECURE=true` in `backend/.env` when the site is served over HTTPS.

## Keep secrets out of git

`backend/.env` holds the database password and is listed in `.gitignore`. Never commit it or share it in a zip.
