# Windows quick start — COEP Venue Booking System

This project uses **React + Vite**, a **Bun/Elysia API**, and **MySQL/MariaDB**.

## One-time setup

1. Install **Bun** from https://bun.sh (then close and reopen Command Prompt).
2. Install **MySQL 8** or **MariaDB 10.5+** and make sure its Windows service is running.
3. Extract this project folder somewhere writable, such as your Desktop.
4. Open `.env` in Notepad. Set `DB_USER` and `DB_PASSWORD` to your local MySQL account.
   - Defaults are `DB_USER=root`, `DB_PASSWORD=` (blank), database `venue_booking`.
   - If your MySQL root account has a password, put it after `DB_PASSWORD=`.
   - Keep the database name `venue_booking` unless you intentionally want a different one.
5. Double-click `setup-windows.bat`. It installs packages and asks whether to initialize the database.
6. Double-click `start-project.bat`.
7. Open **http://localhost:3000** in your browser.
8. Confirm the API/database are working at **http://localhost:3001/api/health**. Expected response: `{"status":"ok","db":true}`.

## Demo login

All seeded demo accounts use password `Coep@1234` unless you changed `DEMO_PASSWORD` in `.env`.

| Role | Login |
|---|---|
| Student | `deshmukha21.comp@coep.ac.in` |
| Faculty | `spatil.comp@coep.ac.in` |
| HOD | `hod.comp@coep.ac.in` |
| Superadmin | `registrar@coeptech.ac.in` |

Choose the matching role on the login screen. Student login also supports MIS number `112103045`.

## Useful commands

Run these in Command Prompt/PowerShell from the project folder:

- `bun install` — install dependencies.
- `bun run db:init` — create the database, tables, and demo data.
- `bun run dev:all` — start API and frontend together.
- `bun run build` — build the frontend.

**Warning:** `bun run db:reset` deletes and recreates the project's tables and demo data. Do not run it if you have data you want to keep.

## Troubleshooting

- **`bun` is not recognized:** install Bun, reopen the terminal, and try `bun --version`.
- **Database connection refused / `ECONNREFUSED`:** start the MySQL/MariaDB Windows service and verify `DB_HOST=localhost` and `DB_PORT=3306`.
- **Access denied for user:** update `DB_USER` and `DB_PASSWORD` in `.env`.
- **Port already in use:** close the other app using port 3000 or 3001, then retry.
- **Login doesn't work:** run `bun run db:init`; if tables already contain users it will not overwrite existing data. Use `bun run db:reset` only if you are happy to erase and recreate all project data.
- The database is MySQL/MariaDB, **not PostgreSQL**. You do not need pgAdmin for this project.
