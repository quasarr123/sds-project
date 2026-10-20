# Venue Booking System:

Task: college venue booking with an in-system approval chain and an
auto-generated approval letter. Full details: docs/venue-booking-project-document.md
(read only the section you need).

Stack: React (Vite) + React Router, Bun server, MariaDB, JWT.

Roles (only 4): student, faculty, hod, superadmin.
Club advisor, lab faculty, venue approver, HOD alternate are assignments in
the database, not roles.

Approval rules:
- Classroom in a department: club advisor, then HOD of the ROOM's department
- Classroom in the Academic Complex: advisor, then venue approver faculty
- Lab: venue approver faculty only
- Seminar hall, mini or main auditorium: advisor, then venue approver faculty
- Faculty extra class in hours: auto-approved
- Each HOD has one fixed alternate (no dates). If the HOD does not act in time,
  the request also goes to the alternate.

Frontend folders (each member edits ONLY their own):
- features/auth, dashboards, settings, audit  -> Member 1
- features/admin                              -> Member 2
- features/booking                            -> Member 3
- features/approvals, letters, timetable      -> Member 4
- components/ and api/client.js are shared: do not edit without asking.

Rules: read VITE_API_URL from .env, never hardcode. No emojis in code.
Simple readable code. Do only what is asked. Commit format: feat: <description>.

Data shapes:
user { id, name, email, role, department_id, is_active }
department { id, name, hod_id }
club { id, name, advisor_id }
venue { id, name, type, building, floor, capacity, owner_type, department_id, approver_id, is_active }
alternate { user_id, alternate_id }
