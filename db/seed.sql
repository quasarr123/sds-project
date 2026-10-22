USE venue_booking;

-- 1. Insert Departments
INSERT INTO departments (id, name) VALUES
  (1, 'Computer Science & Engineering'),
  (2, 'Electronics & Telecommunication'),
  (3, 'Mechanical Engineering'),
  (4, 'Information Technology');

-- 2. Insert Users (password: password123)
-- bcrypt hash for 'password123' is '$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7'
INSERT INTO users (id, name, email, mis_number, password_hash, role, department_id, is_active) VALUES
  (1, 'System Superadmin', 'admin@college.edu', NULL, '$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7', 'superadmin', NULL, 1),
  (2, 'Dr. Ramesh Kulkarni', 'ramesh.cse@college.edu', NULL, '$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7', 'hod', 1, 1),
  (3, 'Dr. Priya Patil', 'priya.entc@college.edu', NULL, '$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7', 'hod', 2, 1),
  (4, 'Prof. Vikas Gupta', 'vikas.faculty@college.edu', NULL, '$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7', 'faculty', 1, 1),
  (5, 'Aarav Sharma', 'aarav.student@college.edu', 'MIS2024001', '$2b$10$wT8K8N1h1q7Z7X7vF8t1yeXjB9Hq9e7e7e7e7e7e7e7e7e7e7e7e7', 'student', 1, 1);

-- 3. Assign HODs to Departments
UPDATE departments SET hod_id = 2 WHERE id = 1;
UPDATE departments SET hod_id = 3 WHERE id = 2;

-- 4. Insert Clubs with Faculty Advisors
INSERT INTO clubs (id, name, advisor_id, department_id) VALUES
  (1, 'Coding Club', 4, 1),
  (2, 'Robotics Club', 4, 2);

-- 5. Insert Venues
INSERT INTO venues (id, name, type, building, floor, capacity, owner_type, department_id, approver_id, is_active) VALUES
  (1, 'Main Auditorium', 'main_auditorium', 'Auditorium Block', 'Ground', 800, 'COMPLEX', NULL, 1, 1),
  (2, 'Seminar Hall 1', 'seminar_hall', 'Academic Complex', '1st Floor', 150, 'COMPLEX', NULL, 4, 1),
  (3, 'CSE Lab 101', 'lab', 'Main Building', '1st Floor', 60, 'DEPARTMENT', 1, 4, 1),
  (4, 'Classroom 201', 'classroom', 'Main Building', '2nd Floor', 70, 'DEPARTMENT', 1, 2, 1);

-- 6. Insert Default Settings
INSERT INTO settings (name, value) VALUES
  ('day_start', '08:30'),
  ('day_end', '18:30'),
  ('max_booking_hours', '4'),
  ('approval_deadline_hours', '48'),
  ('classroom_min_notice_hours', '2'),
  ('classroom_max_advance_days', '14'),
  ('hall_min_notice_days', '3'),
  ('hall_max_advance_days', '30')
ON DUPLICATE KEY UPDATE value = VALUES(value);
