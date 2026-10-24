
USE venue;

CREATE TABLE departments (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(100) NOT NULL UNIQUE,
  hod_id  INT UNSIGNED NULL
);

CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  mis_number     VARCHAR(20) NULL UNIQUE,              -- students only, NULL for staff
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('student','faculty','hod','superadmin') NOT NULL DEFAULT 'student',
  department_id  INT UNSIGNED NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE departments ADD FOREIGN KEY (hod_id) REFERENCES users(id);

CREATE TABLE clubs (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(120) NOT NULL UNIQUE,
  advisor_id     INT UNSIGNED NOT NULL,
  department_id  INT UNSIGNED NULL,
  FOREIGN KEY (advisor_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE venues (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(120) NOT NULL UNIQUE,
  type           ENUM('classroom','lab','seminar_hall','mini_auditorium','main_auditorium') NOT NULL,
  building       VARCHAR(100),
  floor          VARCHAR(20),
  capacity       INT UNSIGNED NOT NULL,
  owner_type     ENUM('DEPARTMENT','COMPLEX') NOT NULL DEFAULT 'DEPARTMENT',
  department_id  INT UNSIGNED NULL,
  approver_id    INT UNSIGNED NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

CREATE TABLE bookings (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venue_id         INT UNSIGNED NOT NULL,
  requester_id     INT UNSIGNED NOT NULL,
  booking_type     ENUM('extra_class','club_event','other') NOT NULL DEFAULT 'other',
  club_id          INT UNSIGNED NULL,
  advisor_id       INT UNSIGNED NULL,
  title            VARCHAR(200) NOT NULL,
  purpose          TEXT,
  expected_people  INT UNSIGNED,
  start_time       DATETIME NOT NULL,
  end_time         DATETIME NOT NULL,
  status           ENUM('pending','approved','rejected','expired','cancelled','completed')
                   NOT NULL DEFAULT 'pending',
  idempotency_key  CHAR(36) NULL,                      -- client UUID, stops double submit
  cancel_reason    VARCHAR(300) NULL,
  cancelled_by     INT UNSIGNED NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(id),
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (advisor_id) REFERENCES users(id),
  FOREIGN KEY (cancelled_by) REFERENCES users(id),
  CHECK (end_time > start_time),
  UNIQUE KEY uq_booking_idempotency (requester_id, idempotency_key),
  INDEX idx_venue_time (venue_id, start_time, end_time),
  INDEX idx_requester (requester_id),
  INDEX idx_status (status)
);

CREATE TABLE approvals (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id    BIGINT UNSIGNED NOT NULL,
  step_order    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  approver_id   INT UNSIGNED NOT NULL,
  decision      ENUM('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
  acted_by      INT UNSIGNED NULL,
  on_behalf_of  INT UNSIGNED NULL,
  remarks       VARCHAR(500),
  escalate_at   DATETIME NULL,                         -- when the alternate gets the request
  escalated_at  DATETIME NULL,                         -- set when it was actually escalated
  due_at        DATETIME NULL,                         -- final deadline, then EXPIRED
  decided_at    DATETIME NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id),
  FOREIGN KEY (acted_by) REFERENCES users(id),
  FOREIGN KEY (on_behalf_of) REFERENCES users(id),
  UNIQUE (booking_id, step_order),
  INDEX idx_approver_pending (approver_id, decision),
  INDEX idx_due (decision, due_at)
);

CREATE TABLE alternates (
  user_id       INT UNSIGNED PRIMARY KEY,    -- the approver (for example an HOD)
  alternate_id  INT UNSIGNED NOT NULL,       -- gets the request if the approver does not act in time
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (alternate_id) REFERENCES users(id),
  CHECK (user_id <> alternate_id)
);

CREATE TABLE letters (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id    BIGINT UNSIGNED NOT NULL UNIQUE,
  letter_no     VARCHAR(40) NOT NULL UNIQUE,
  issued_by     INT UNSIGNED NOT NULL,
  on_behalf_of  INT UNSIGNED NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (issued_by) REFERENCES users(id),
  FOREIGN KEY (on_behalf_of) REFERENCES users(id)
);

-- type = 'holiday' makes the period count as after-hours; any other type blocks booking.
CREATE TABLE blackout_periods (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venue_id    INT UNSIGNED NULL,
  type        ENUM('holiday','exam','maintenance','other') NOT NULL DEFAULT 'other',
  start_time  DATETIME NOT NULL,
  end_time    DATETIME NOT NULL,
  reason      VARCHAR(200),
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CHECK (end_time > start_time)
);

-- Regular timetable (weekly repeating classes and labs)
CREATE TABLE timetable_slots (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venue_id     INT UNSIGNED NOT NULL,
  day_of_week  TINYINT UNSIGNED NOT NULL,        -- 1 = Mon ... 6 = Sat
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  slot_type    ENUM('lecture','lab') NOT NULL DEFAULT 'lecture',
  class_name   VARCHAR(60) NOT NULL,             -- e.g. 'SE CSE A'
  subject      VARCHAR(120) NULL,
  faculty_id   INT UNSIGNED NULL,
  valid_from   DATE NOT NULL,                    -- semester start
  valid_to     DATE NOT NULL,                    -- semester end
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id),
  CHECK (day_of_week BETWEEN 1 AND 6),
  CHECK (end_time > start_time),
  CHECK (valid_to >= valid_from),
  INDEX idx_tt_lookup (venue_id, day_of_week, start_time, end_time)
);

CREATE TABLE settings (
  name   VARCHAR(50) PRIMARY KEY,
  value  VARCHAR(100) NOT NULL
);

INSERT INTO settings (name, value) VALUES
  ('day_start', '08:30'),
  ('day_end', '18:30'),
  ('max_booking_hours', '4'),
  ('approval_deadline_hours', '48'),
  ('classroom_min_notice_hours', '2'),
  ('classroom_max_advance_days', '14'),
  ('hall_min_notice_days', '3'),
  ('hall_max_advance_days', '30');

CREATE TABLE audit_log (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id  BIGINT UNSIGNED NULL,
  actor_id    INT UNSIGNED NULL,
  action      VARCHAR(50) NOT NULL,
  details     TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_booking (booking_id)
);