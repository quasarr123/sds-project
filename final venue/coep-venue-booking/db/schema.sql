-- COEP Venue Booking System - database schema (MySQL 8 / MariaDB 10.5+)
-- Run with:  bun run db:init   (creates the database, tables and demo data)

CREATE TABLE IF NOT EXISTS departments (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  mis_number    VARCHAR(20)  NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','faculty','hod','superadmin') NOT NULL,
  department_id INT UNSIGNED NULL,
  designation   VARCHAR(160) NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  token_hash   CHAR(64)     NOT NULL UNIQUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME     NOT NULL,
  last_seen_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip           VARCHAR(45)  NULL,
  user_agent   VARCHAR(500) NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS venues (
  id                VARCHAR(40)  PRIMARY KEY,
  name              VARCHAR(160) NOT NULL,
  location          VARCHAR(255) NOT NULL,
  capacity          INT UNSIGNED NOT NULL,
  type              VARCHAR(80)  NOT NULL,
  amenities         TEXT         NOT NULL,            -- JSON array
  department        VARCHAR(120) NOT NULL,
  is_air_conditioned TINYINT(1)  NOT NULL DEFAULT 0,
  status            VARCHAR(30)  NOT NULL DEFAULT 'Available',
  image             VARCHAR(500) NULL,
  hourly_rate       VARCHAR(80)  NULL,
  category          VARCHAR(20)  NULL                 -- 'department' | 'central' | 'club'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student clubs. Club bookings go to the club's faculty advisor first, then the superadmin.
CREATE TABLE IF NOT EXISTS clubs (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(190) NOT NULL UNIQUE,
  faculty_advisor_id  INT UNSIGNED NULL,
  CONSTRAINT fk_clubs_advisor FOREIGN KEY (faculty_advisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  seq                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id                  VARCHAR(30)  NOT NULL UNIQUE,   -- e.g. BK-2026-081
  venue_id            VARCHAR(40)  NOT NULL,
  venue_name          VARCHAR(160) NOT NULL,
  title               VARCHAR(255) NOT NULL,
  user_id             INT UNSIGNED NOT NULL,
  booked_by           VARCHAR(160) NOT NULL,
  role                VARCHAR(20)  NOT NULL,
  club                VARCHAR(255) NULL,
  department          VARCHAR(120) NULL,
  booking_date        DATE         NOT NULL,
  time_slot           VARCHAR(80)  NOT NULL,          -- display text, e.g. '03:00 PM - 04:00 PM'
  start_time          TIME         NULL,              -- parsed from time_slot; used for overlap checks
  end_time            TIME         NULL,              -- (end is exclusive: 3-4 PM and 4-5 PM do not clash)
  attendees           INT UNSIGNED NOT NULL DEFAULT 0,
  purpose             TEXT         NOT NULL,
  status              VARCHAR(30)  NOT NULL,
  approved_by         VARCHAR(255) NULL,
  endorsement         TEXT         NULL,
  stage               VARCHAR(80)  NULL,
  rejection_reason    TEXT         NULL,
  hod_notes           TEXT         NULL,
  cancellation_reason TEXT         NULL,
  cancelled_by        VARCHAR(160) NULL,
  cancelled_at        DATETIME     NULL,
  created_at          DATETIME     NOT NULL,
  booking_type        VARCHAR(20)  NULL,              -- regular | club | extra_class | other
  route               VARCHAR(20)  NULL,              -- auto | hod | superadmin | club
  club_id             INT UNSIGNED NULL,
  advisor_id          INT UNSIGNED NULL,              -- club faculty advisor who must approve first
  review_department   VARCHAR(120) NULL,              -- department whose HOD reviews it
  CONSTRAINT fk_bookings_venue FOREIGN KEY (venue_id) REFERENCES venues(id),
  CONSTRAINT fk_bookings_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  INDEX idx_bookings_venue_date (venue_id, booking_date),
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Who approved / rejected each booking, and at which step.
CREATE TABLE IF NOT EXISTS booking_approvals (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id    VARCHAR(30)  NOT NULL,
  step          VARCHAR(20)  NOT NULL,                -- advisor | hod | superadmin | auto
  decision      VARCHAR(20)  NOT NULL,                -- approved | rejected
  approver_id   INT UNSIGNED NULL,
  approver_name VARCHAR(160) NOT NULL,
  approver_role VARCHAR(20)  NOT NULL,
  note          TEXT         NULL,
  created_at    DATETIME     NOT NULL,
  INDEX idx_approvals_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS holidays (
  id              VARCHAR(40)  PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  start_date      DATE         NOT NULL,
  end_date        DATE         NOT NULL,
  type            VARCHAR(80)  NOT NULL,
  reason          TEXT         NOT NULL,
  affected_venues VARCHAR(500) NOT NULL,
  is_strict_block TINYINT(1)   NOT NULL DEFAULT 1,
  created_by      VARCHAR(160) NOT NULL,
  created_at      DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id         TINYINT UNSIGNED PRIMARY KEY,            -- always 1 (single row)
  data       TEXT NOT NULL,                           -- JSON object
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  actor      VARCHAR(160) NOT NULL,
  role       VARCHAR(20)  NOT NULL,
  action     VARCHAR(60)  NOT NULL,
  target     VARCHAR(255) NOT NULL,
  ip_address VARCHAR(80)  NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS',
  details    TEXT         NULL,
  created_at DATETIME     NOT NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
