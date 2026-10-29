-- MySQL dump 10.13  Distrib 26.10.0, for Win64 (x86_64)
--
-- Host: localhost    Database: venue_booking
-- ------------------------------------------------------
-- Server version	26.10.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- GTID state at the beginning of the backup 
--


--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `actor` varchar(160) NOT NULL,
  `role` varchar(20) NOT NULL,
  `action` varchar(60) NOT NULL,
  `target` varchar(255) NOT NULL,
  `ip_address` varchar(80) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'SUCCESS',
  `details` text,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,401,'Col. Vikram Shinde','superadmin','BOOKING_APPROVED','BK-2026-081 (MindSpark Hackathon)','10.20.1.4','SUCCESS','Final approval granted for Main Auditorium. Gate pass auto-dispatched to Campus Security.','2026-10-19 11:25:10'),(2,101,'Aarav Deshmukh','student','BOOKING_SUBMITTED','BK-2026-084 (BAJA SAE Unveiling)','10.20.1.4','SUCCESS','Submitted request for Mechanical Seminar Hall. Attached faculty advisory recommendation.','2026-10-19 10:14:02'),(3,301,'Prof. Dr. Rajesh Kulkarni','hod','BOOKING_REJECTED','BK-2026-086 (Rock Band Practice)','10.20.1.4','WARNING','Rejected with mandatory explanation: Exceeds permitted decibel limits and campus night curfew.','2026-10-18 16:42:19'),(4,401,'Col. Vikram Shinde','superadmin','BLOCKED_DATE_ADDED','HOL-2 (End-Semester Exam Lockout)','10.20.1.4','SUCCESS','Added blocked lockout window from 2026-11-20 to 2026-12-05 for university winter examinations.','2026-10-17 14:05:30'),(5,201,'Dr. Sunita Patil','faculty','PASSWORD_CHANGED','User Account u-201','10.20.1.4','SUCCESS','Password updated through authenticated credential self-service portal.','2026-10-16 09:12:44'),(6,401,'Col. Vikram Shinde','superadmin','SETTINGS_UPDATED','Global System Settings','10.20.1.4','SUCCESS','Updated minLeadTimeDays to 3 and autoEscalateHours to 48 hours.','2026-10-15 17:30:11'),(7,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 18:51:54'),(8,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 18:52:07'),(9,NULL,'1','unknown','LOGIN_FAILED','Session 1','::1','WARNING','Invalid credentials supplied.','2026-10-24 18:52:11'),(10,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 18:52:33'),(11,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 18:52:41'),(12,NULL,'1','unknown','LOGIN_FAILED','Session 1','::1','WARNING','Invalid credentials supplied.','2026-10-24 18:52:48'),(13,201,'Dr. Sunita Patil','faculty','USER_LOGIN','Session spatil.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 18:54:04'),(14,201,'Dr. Sunita Patil','faculty','USER_LOGOUT','Session spatil.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 18:54:14'),(15,401,'Col. Vikram Shinde (Retd.)','superadmin','USER_LOGIN','Session registrar@coeptech.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 18:55:23'),(16,401,'Col. Vikram Shinde (Retd.)','superadmin','USER_LOGOUT','Session registrar@coeptech.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 18:56:55'),(17,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 18:58:43'),(18,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 19:01:43'),(19,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:01:58'),(20,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 19:24:18'),(21,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:24:26'),(22,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 19:37:33'),(23,201,'Dr. Sunita Patil','faculty','USER_LOGIN','Session spatil.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:47:23'),(24,201,'Dr. Sunita Patil','faculty','USER_LOGIN','Session spatil.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:47:26'),(25,201,'Dr. Sunita Patil','faculty','USER_LOGOUT','Session spatil.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 19:47:26'),(26,401,'Col. Vikram Shinde (Retd.)','superadmin','USER_LOGIN','Session registrar@coeptech.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:47:29'),(27,201,'Dr. Sunita Patil','faculty','USER_LOGIN','Session spatil.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:47:43'),(28,201,'Dr. Sunita Patil','faculty','USER_LOGOUT','Session spatil.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 19:47:43'),(29,301,'Prof. Dr. Rajesh Kulkarni','hod','USER_LOGIN','Session hod.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 19:48:27'),(30,301,'Prof. Dr. Rajesh Kulkarni','hod','USER_LOGOUT','Session hod.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-24 19:51:29'),(31,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-24 20:28:31'),(32,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 09:47:41'),(33,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-25 10:02:37'),(34,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 10:34:03'),(35,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 11:20:17'),(36,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-25 11:28:12'),(37,NULL,'spatil.comp@coep.ac.in','faculty','LOGIN_FAILED','Session spatil.comp@coep.ac.in','::1','WARNING','Invalid credentials supplied.','2026-10-25 11:28:39'),(38,NULL,'spatil.comp@coep.ac.in','faculty','LOGIN_FAILED','Session spatil.comp@coep.ac.in','::1','WARNING','Invalid credentials supplied.','2026-10-25 11:28:44'),(39,201,'Dr. Sunita Patil','faculty','USER_LOGIN','Session spatil.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 11:28:50'),(40,201,'Dr. Sunita Patil','faculty','USER_LOGOUT','Session spatil.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-25 11:28:58'),(41,NULL,'hod.comp@coep.ac.in','hod','LOGIN_FAILED','Session hod.comp@coep.ac.in','::1','WARNING','Invalid credentials supplied.','2026-10-25 11:29:15'),(42,301,'Prof. Dr. Rajesh Kulkarni','hod','USER_LOGIN','Session hod.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 11:29:21'),(43,301,'Prof. Dr. Rajesh Kulkarni','hod','USER_LOGOUT','Session hod.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-25 11:29:38'),(44,401,'Col. Vikram Shinde (Retd.)','superadmin','USER_LOGIN','Session registrar@coeptech.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 11:29:46'),(45,401,'Col. Vikram Shinde (Retd.)','superadmin','USER_LOGOUT','Session registrar@coeptech.ac.in','::1','SUCCESS','User terminated active session.','2026-10-25 11:35:00'),(46,101,'Aarav Deshmukh','student','USER_LOGIN','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','Successful authenticated login.','2026-10-25 11:39:16'),(47,101,'Aarav Deshmukh','student','USER_LOGOUT','Session deshmukha21.comp@coep.ac.in','::1','SUCCESS','User terminated active session.','2026-10-25 12:16:09');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `seq` int unsigned NOT NULL AUTO_INCREMENT,
  `id` varchar(30) NOT NULL,
  `venue_id` varchar(40) NOT NULL,
  `venue_name` varchar(160) NOT NULL,
  `title` varchar(255) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `booked_by` varchar(160) NOT NULL,
  `role` varchar(20) NOT NULL,
  `club` varchar(255) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `booking_date` date NOT NULL,
  `time_slot` varchar(80) NOT NULL,
  `attendees` int unsigned NOT NULL DEFAULT '0',
  `purpose` text NOT NULL,
  `status` varchar(30) NOT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `endorsement` text,
  `stage` varchar(80) DEFAULT NULL,
  `rejection_reason` text,
  `hod_notes` text,
  `cancellation_reason` text,
  `cancelled_by` varchar(160) DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `id` (`id`),
  KEY `idx_bookings_venue_date` (`venue_id`,`booking_date`),
  KEY `idx_bookings_user` (`user_id`),
  KEY `idx_bookings_status` (`status`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_bookings_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (81,'BK-2026-081','v-auditorium','Main Auditorium','MindSpark 26 Technical Hackathon Inauguration',101,'Aarav Deshmukh','student','MindSpark Tech Club / CSI Student Chapter','Computer Engineering','2026-10-25','09:00 AM - 01:00 PM',450,'National level annual technical fest opening ceremony with keynote address by Industry leaders.','Approved','Col. Vikram Shinde (Superadmin)','Strongly recommended. Faculty advisor verified budget and safety norms.','Completed Approval',NULL,NULL,NULL,NULL,NULL,'2026-10-14 11:20:00'),(82,'BK-2026-082','v-comp-hall','Turing Computer Seminar Hall','AI & Quantum Computing Guest Lecture Series',201,'Dr. Sunita Patil','faculty',NULL,'Computer Engineering','2026-10-26','02:00 PM - 05:00 PM',120,'Distinguished visiting professor from IISc Bangalore delivering session on Post-Quantum Cryptography.','Pending HOD','Pending review by Prof. Dr. Rajesh Kulkarni','Academic curriculum enrichment program.','Level 2: HOD Review',NULL,NULL,NULL,NULL,NULL,'2026-10-18 16:15:00'),(83,'BK-2026-083','v-boatclub','COEP Boat Club Lawn & Deck','Regatta 98 Traditional Alumni Boat Race Briefing',102,'Tanvi Joshi (Student Secretary)','student','COEP Boat Club Managing Committee','Mechanical Engineering','2026-10-28','04:00 PM - 07:30 PM',300,'Coordination meeting for historic Regatta races with alumni team captains and safety marshals.','Pending Superadmin','Endorsed by HOD Mechanical. Awaiting Registrar clearance.','Safety equipment and rescue boats reserved.','Level 3: Central Estate Superadmin',NULL,NULL,NULL,NULL,NULL,'2026-10-17 09:30:00'),(84,'BK-2026-084','v-mech-hall','Mechanical Seminar Hall','BAJA SAE Racing Vehicle Unveiling Ceremony',103,'Team Nemesis BAJA COEP','student','SAE Collegiate Club','Mechanical Engineering','2026-10-29','10:00 AM - 01:30 PM',220,'Unveiling of the newly fabricated all-terrain electric BAJA vehicle for 2026 national championship.','Pending Faculty','Pending Faculty Advisor verification','Awaiting faculty advisor signature.','Level 1: Faculty Advisor Review',NULL,NULL,NULL,NULL,NULL,'2026-10-19 10:00:00'),(85,'BK-2026-085','v-oat','Open Air Theatre (OAT)','Zest 26 Inter-Collegiate Sports Fest Cultural Evening',104,'Rohan Gaikwad','student','Zest Sports & Cultural Committee','Civil Engineering','2026-11-04','05:30 PM - 10:00 PM',1100,'Cultural stage performance and musical showcase during inter-college athletics tournament.','Approved','Col. Vikram Shinde (Superadmin)','Security permission obtained from Deccan Police station.','Completed Approval',NULL,NULL,NULL,NULL,NULL,'2026-10-12 14:40:00'),(86,'BK-2026-086','v-auditorium','Main Auditorium','Late Night Rock Band Practice Session',105,'Music Society Student Body','student','COEP Spandan Music Club','Electrical Engineering','2026-10-22','08:00 PM - 11:30 PM',60,'Practice session for university festival.','Rejected','Rejected by Prof. Dr. Rajesh Kulkarni',NULL,'Rejected','Exceeds campus noise ordinance and allowable hours after 08:00 PM without special Dean approval.',NULL,NULL,NULL,NULL,'2026-10-15 13:10:00'),(87,'BK-2026-087','v-meta-hall','Metallurgy AC Auditorium','National Metallurgy Research Colloquium',205,'Prof. Dr. N. B. Dhokey','faculty',NULL,'Metallurgy Engineering','2026-10-31','09:00 AM - 05:00 PM',140,'Joint symposium with Tata Steel & ISRO Materials Lab on cryo-treated titanium alloys.','Approved','Col. Vikram Shinde (Superadmin)','Sponsored by DST grant.','Completed Approval',NULL,NULL,NULL,NULL,NULL,'2026-10-10 11:00:00'),(88,'BK-2026-088','v-comp-hall','Turing Computer Seminar Hall','Annual Campus Placement Orientation: Microsoft & Google',206,'Training & Placement Cell','faculty',NULL,'Computer Engineering','2026-11-02','10:00 AM - 01:00 PM',175,'Placement drive mock interview guidelines and coding test briefing for final year students.','Approved','Col. Vikram Shinde (Superadmin)','Critical career activity.','Completed Approval',NULL,NULL,NULL,NULL,NULL,'2026-10-16 15:20:00');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (6,'Central Estate & Administration Office'),(3,'Civil Engineering'),(1,'Computer Engineering'),(4,'Electrical Engineering'),(2,'Mechanical Engineering'),(5,'Metallurgy Engineering');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` varchar(40) NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` varchar(80) NOT NULL,
  `reason` text NOT NULL,
  `affected_venues` varchar(500) NOT NULL,
  `is_strict_block` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` varchar(160) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES ('hol-1','Diwali Break & Campus Holiday','2026-11-08','2026-11-13','Official University Holiday','State Government Diwali vacation - All academic blocks closed.','All Venues',1,'Registrar Office','2026-10-01 10:00:00'),('hol-2','End-Semester Final Theory Examinations (Winter 26)','2026-11-20','2026-12-05','Exam Lockout Window','Strict academic silence required campus-wide. No student fest or cultural bookings permitted.','Main Auditorium, Turing Computer Seminar Hall, Mechanical Seminar Hall',1,'Controller of Examinations','2026-10-01 10:00:00'),('hol-3','COEP Annual Convocation 2026 Rehearsal & Main Event','2026-12-18','2026-12-20','Administrative Lockdown','State Governor & Chancellor visit. High-security protocol.','Main Auditorium, COEP Boat Club Lawn & Deck',1,'Col. Vikram Shinde (Superadmin)','2026-10-01 10:00:00'),('hol-4','Republic Day Celebration Setup','2027-01-25','2027-01-26','Official University Holiday','Parade drills, Flag hoisting dais setup, and civic felicitation.','Main Auditorium, COEP Boat Club Lawn & Deck, Open Air Theatre (OAT)',1,'Central Administration','2026-10-01 10:00:00');
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token_hash` char(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expiry` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (8,201,'dad498f6a66ebb063356a3af28c96dbe5820d10a8f90b9761c960987f89309f5','2026-10-24 14:17:23','2026-10-24 22:17:23','2026-10-24 14:17:23','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36'),(10,401,'6561b6062b8899a45b6eca881ddf1137f6819ac81725afc139ca5d6145b4ee59','2026-10-24 14:17:29','2026-10-24 22:17:29','2026-10-24 14:17:29','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36'),(13,101,'2437c6c0efdba8dc45605d2e1a3b24fb77e2870965cef9fc113c5faf5a249d76','2026-10-24 14:58:31','2026-10-24 22:58:31','2026-10-24 14:58:31','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` tinyint unsigned NOT NULL,
  `data` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'{\"minLeadTimeDays\":3,\"maxAdvanceDays\":60,\"allowWeekendBooking\":true,\"autoEscalateHours\":48,\"dailyClosingTime\":\"21:30\",\"dailyOpeningTime\":\"07:30\",\"autoNotifyEmail\":true,\"autoNotifySMS\":true,\"requireFacultyEndorsementForStudents\":true,\"requireHODApprovalForDeptVenues\":true,\"maxConcurrentBookingsPerClub\":2,\"gracePeriodMinutesForCancellation\":24,\"maintenanceWindowHoursWeekly\":8,\"termsAndConditions\":\"All student clubs must adhere to COEP sound limits (below 65dB post 8 PM) and vacate venues within 30 minutes of reservation expiration. Alcohol, tobacco, or hazardous pyrotechnics are strictly banned under Maharashtra University Act.\"}','2026-10-24 13:14:08');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `mis_number` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','faculty','hod','superadmin') NOT NULL,
  `department_id` int unsigned DEFAULT NULL,
  `designation` varchar(160) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `mis_number` (`mis_number`),
  KEY `fk_users_department` (`department_id`),
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=402 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (101,'Aarav Deshmukh','deshmukha21.comp@coep.ac.in','112103045','$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','student',1,'B.Tech Student',1,'2026-10-25 06:09:16','2026-10-24 13:14:08'),(102,'Tanvi Joshi (Student Secretary)','joshit21.mech@coep.ac.in','112103046','$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','student',2,'B.Tech Student',1,NULL,'2026-10-24 13:14:08'),(103,'Team Nemesis BAJA COEP','baja.mech@coep.ac.in','112103047','$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','student',2,'B.Tech Student',1,NULL,'2026-10-24 13:14:08'),(104,'Rohan Gaikwad','gaikwadr21.civil@coep.ac.in','112103048','$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','student',3,'B.Tech Student',1,NULL,'2026-10-24 13:14:08'),(105,'Music Society Student Body','spandan.elec@coep.ac.in','112103049','$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','student',4,'B.Tech Student',1,NULL,'2026-10-24 13:14:08'),(201,'Dr. Sunita Patil','spatil.comp@coep.ac.in',NULL,'$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','faculty',1,'Associate Professor & MindSpark Faculty Incharge',1,'2026-10-25 05:58:50','2026-10-24 13:14:08'),(205,'Prof. Dr. N. B. Dhokey','nbdhokey.meta@coep.ac.in',NULL,'$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','faculty',5,'Professor',1,NULL,'2026-10-24 13:14:08'),(206,'Training & Placement Cell','placement@coep.ac.in',NULL,'$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','faculty',1,'Placement Coordinator',1,NULL,'2026-10-24 13:14:08'),(301,'Prof. Dr. Rajesh Kulkarni','hod.comp@coep.ac.in',NULL,'$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','hod',1,'Head of Department',1,'2026-10-25 05:59:21','2026-10-24 13:14:08'),(401,'Col. Vikram Shinde (Retd.)','registrar@coeptech.ac.in',NULL,'$argon2id$v=19$m=65536,t=2,p=1$GlknYKlZj720Abjoc0qjqHsoL91uj1tnHSJuoNQbCxA$3OUul+dR1qU1Ni7bgHKyaTtDk3DqniCQ+kqMaLBhXr0','superadmin',6,'Superadmin / Registrar',1,'2026-10-25 05:59:46','2026-10-24 13:14:08');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venues`
--

DROP TABLE IF EXISTS `venues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venues` (
  `id` varchar(40) NOT NULL,
  `name` varchar(160) NOT NULL,
  `location` varchar(255) NOT NULL,
  `capacity` int unsigned NOT NULL,
  `type` varchar(80) NOT NULL,
  `amenities` text NOT NULL,
  `department` varchar(120) NOT NULL,
  `is_air_conditioned` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(30) NOT NULL DEFAULT 'Available',
  `image` varchar(500) DEFAULT NULL,
  `hourly_rate` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venues`
--

LOCK TABLES `venues` WRITE;
/*!40000 ALTER TABLE `venues` DISABLE KEYS */;
INSERT INTO `venues` VALUES ('v-auditorium','Main Auditorium','North Campus, Main Heritage Building',900,'Auditorium','[\"Central AC\",\"Digital Dolby 7.1\",\"Dual 4K Laser Projectors\",\"Green Rooms (2)\",\"Podium Mic\",\"Stage Lighting Rig\"]','Central Administration',1,'Available','https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80','Free for Academic'),('v-boatclub','COEP Boat Club Lawn & Deck','Mula Riverfront, South Campus',650,'Outdoor & Pavilion','[\"Riverfront Promenade\",\"Regatta Pavilion\",\"Open Stage\",\"Floodlights\",\"Generator Backup\"]','Gymkhana & Sports Committee',0,'Available','https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&w=600&q=80','Free for Academic'),('v-comp-hall','Turing Computer Seminar Hall','3rd Floor, Academic Complex II (North Campus)',180,'Smart Seminar Hall','[\"High-speed WiFi 6\",\"Interactive Digital Board\",\"Dual Projection\",\"Individual Laptop Power Sockets\"]','Computer Engineering',1,'Available','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80','Free for Academic'),('v-mech-hall','Mechanical Seminar Hall','Ground Floor, Dept of Mechanical Engineering',260,'Seminar Hall','[\"Tiered Amphitheater Seating\",\"AC\",\"Motorized Screen\",\"Lavalier Mics\",\"Polycom VC\"]','Mechanical Engineering',1,'Available','https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80','Free for Academic'),('v-meta-hall','Metallurgy AC Auditorium','Dept of Metallurgy and Materials Science',150,'Auditorium','[\"AC\",\"Surround Sound\",\"Recording Setup\",\"Laser Pointer\",\"VIP Lounge\"]','Metallurgy Engineering',1,'Available','https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80','Free for Academic'),('v-mini-audi','B.J. Somaiya Mini Auditorium','2nd Floor, Main Building',110,'Conference Hall','[\"Full AC\",\"Conference Mic Console\",\"Overhead Projector\",\"Executive Seating\"]','Central Administration',1,'Under Maintenance','https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80','Free for Academic'),('v-oat','Open Air Theatre (OAT)','Beside Hostel Complex, South Campus',1200,'Open Air Amphitheatre','[\"Acoustic Shell\",\"High-Output PA System\",\"Spotlights\",\"Crowd Barricades\",\"Backstage Stalls\"]','Gymkhana Cultural Wing',0,'Available','https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80','Free for Academic');
/*!40000 ALTER TABLE `venues` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-25 13:42:09
