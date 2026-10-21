-- Venue Booking System schema (MariaDB 10.5+, InnoDB)
-- Store all DATETIME values in UTC. Convert to campus local time in the app.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------
-- People
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  mis_number     VARCHAR(20)  NULL UNIQUE,          -- students only; NULL for faculty/HOD/admin
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('requester','approver','admin') NOT NULL DEFAULT 'requester',
  user_type      ENUM('student','faculty','hod','admin') NOT NULL DEFAULT 'student', -- drives UI routing
  department_id  INT UNSIGNED NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,     -- deactivate instead of deleting
  last_login_at  DATETIME NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_users_mis (mis_number)                 -- fast student login lookup
);

-- Server-side sessions (store a HASH of the cookie token, never the raw token)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash    CHAR(64) PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT UTC_TIMESTAMP(),
  expires_at    DATETIME NOT NULL,
  last_seen_at  DATETIME NULL,
  ip            VARCHAR(45) NULL,
  user_agent    VARCHAR(255) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expiry (expires_at)
);

-- ---------------------------------------------------------------
-- Venues
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(120) NOT NULL UNIQUE,
  type                 ENUM('classroom','seminar_hall','auditorium','lab','other') NOT NULL,
  building             VARCHAR(100),
  floor                VARCHAR(20),
  capacity             INT UNSIGNED NOT NULL,
  requires_approval    BOOLEAN NOT NULL DEFAULT TRUE,
  -- booking rules (validated in the app before the clash check)
  slot_minutes         SMALLINT UNSIGNED NOT NULL DEFAULT 30,   -- grid size; don't change once bookings exist
  min_booking_minutes  SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  max_booking_minutes  SMALLINT UNSIGNED NOT NULL DEFAULT 480,
  buffer_minutes       SMALLINT UNSIGNED NOT NULL DEFAULT 0,    -- setup/cleanup gap between bookings
  max_advance_days     SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  open_time            TIME NOT NULL DEFAULT '08:30:00',        -- campus local time
  close_time           TIME NOT NULL DEFAULT '20:00:00',        -- campus local time
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (close_time > open_time),
  CHECK (max_booking_minutes >= min_booking_minutes)
);

-- Who can approve bookings for a venue (replaces a single approver_id).
-- step_order supports multi-level approval (1 = HOD, 2 = principal, ...).
-- Any approver on a step can satisfy that step (rule lives in the app).
CREATE TABLE IF NOT EXISTS venue_approvers (
  venue_id    INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  step_order  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (venue_id, user_id),
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurrence_rules (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  frequency   ENUM('daily','weekly','monthly') NOT NULL,
  interval_n  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  by_weekday  SET('MON','TUE','WED','THU','FRI','SAT','SUN') NULL,
  until_date  DATE NOT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venue_id         INT UNSIGNED NOT NULL,
  requester_id     INT UNSIGNED NOT NULL,
  title            VARCHAR(200) NOT NULL,
  purpose          TEXT,
  expected_people  INT UNSIGNED,
  start_time       DATETIME NOT NULL,                 -- UTC
  end_time         DATETIME NOT NULL,                 -- UTC
  status           ENUM('pending','approved','rejected','cancelled','expired') NOT NULL DEFAULT 'pending',

  -- concurrency / safety
  idempotency_key  CHAR(36) NULL,                     -- client-generated UUID; stops double-submit
  version          INT UNSIGNED NOT NULL DEFAULT 1,   -- optimistic locking for status changes
  expires_at       DATETIME NULL,                     -- pending requests auto-expire after this

  recurrence_id    BIGINT UNSIGNED NULL,
  approved_at      DATETIME NULL,
  cancelled_at     DATETIME NULL,
  cancel_reason    VARCHAR(300) NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (venue_id)      REFERENCES venues(id),
  FOREIGN KEY (requester_id)  REFERENCES users(id),
  FOREIGN KEY (recurrence_id) REFERENCES recurrence_rules(id) ON DELETE SET NULL,
  CHECK (end_time > start_time),

  UNIQUE KEY uq_booking_idempotency (requester_id, idempotency_key),   -- NULLs are allowed repeatedly
  INDEX idx_overlap (venue_id, status, start_time, end_time),
  INDEX idx_requester (requester_id, start_time),
  INDEX idx_pending_expiry (status, expires_at)
);

-- Database-enforced backstop against double booking.
-- One row per slot of every APPROVED booking. The primary key makes it
-- impossible for two approved bookings to share a slot, even if app code is buggy.
-- Insert rows when a booking becomes approved; delete them on cancel.
CREATE TABLE IF NOT EXISTS booking_slots (
  venue_id    INT UNSIGNED NOT NULL,
  slot_start  DATETIME NOT NULL,                      -- UTC, aligned to venues.slot_minutes
  booking_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (venue_id, slot_start),
  INDEX idx_slots_booking (booking_id),
  FOREIGN KEY (venue_id)   REFERENCES venues(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approvals (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id   BIGINT UNSIGNED NOT NULL,
  approver_id  INT UNSIGNED NOT NULL,
  step_order   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  decision     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  remarks      VARCHAR(500),
  decided_at   DATETIME NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id),
  UNIQUE KEY uq_approval (booking_id, approver_id),
  INDEX idx_approver_inbox (approver_id, decision)
);

-- ---------------------------------------------------------------
-- Unavailability
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blackout_periods (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venue_id    INT UNSIGNED NULL,                      -- NULL = applies to every venue
  type        ENUM('holiday','exam','maintenance','timetable','other') NOT NULL DEFAULT 'other',
  start_time  DATETIME NOT NULL,                      -- UTC
  end_time    DATETIME NOT NULL,                      -- UTC
  reason      VARCHAR(200),
  created_by  INT UNSIGNED NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id)   REFERENCES venues(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)  ON DELETE SET NULL,
  CHECK (end_time > start_time),
  INDEX idx_blackout (venue_id, start_time, end_time)
);

-- ---------------------------------------------------------------
-- Traceability and notifications
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id  BIGINT UNSIGNED NULL,
  actor_id    INT UNSIGNED NULL,
  action      VARCHAR(50) NOT NULL,                   -- created, approved, rejected, cancelled, expired...
  details     JSON NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_booking (booking_id),
  INDEX idx_audit_created (created_at)
);

-- Transactional outbox: insert in the SAME transaction as the booking change,
-- then a background worker sends the email/message and marks it sent.
-- This way a crash can't lose a notification or send one for a rolled-back booking.
CREATE TABLE IF NOT EXISTS notification_outbox (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  booking_id  BIGINT UNSIGNED NULL,
  type        VARCHAR(50) NOT NULL,                   -- booking_requested, booking_approved...
  payload     JSON NULL,
  status      ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at     DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_outbox_queue (status, created_at)
);