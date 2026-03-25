-- Contractor/Job Mobile App - Complete Database Schema
-- ERD for contractor/job matching platform with time tracking, quality control, and invoicing

-- Core entity: Contractor profiles
CREATE TABLE contractor (
  contractor_id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_type VARCHAR(20) NOT NULL COMMENT 'hourly or subcontractor',
  name VARCHAR(255) NOT NULL,
  contact_info VARCHAR(255),
  years_experience INT,
  average_rating DECIMAL(3,2),
  verified_by_platform BOOLEAN DEFAULT FALSE,
  background_check_passed BOOLEAN DEFAULT FALSE,
  preferred_job_types JSON,
  work_hours_preference JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Job postings/assignments
CREATE TABLE job (
  job_id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  vendor_id INT,
  job_type VARCHAR(100),
  location VARCHAR(255),
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  quote_amount DECIMAL(10,2),
  required_licenses JSON,
  required_certifications JSON,
  job_status VARCHAR(50) COMMENT 'open, assigned, in_progress, completed, cancelled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Job sessions: tracks when a contractor is assigned to and working on a job
CREATE TABLE job_session (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  job_id INT NOT NULL,
  contractor_id INT NOT NULL,
  job_accepted BOOLEAN,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  job_completed BOOLEAN,
  session_status VARCHAR(50) COMMENT 'pending, in_progress, completed, cancelled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES job(job_id),
  FOREIGN KEY (contractor_id) REFERENCES contractor(contractor_id),
  INDEX idx_contractor_id (contractor_id),
  INDEX idx_job_id (job_id),
  INDEX idx_session_status (session_status)
);

-- Contractor licenses
CREATE TABLE license (
  license_id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  license_type VARCHAR(100),
  provider VARCHAR(100),
  expiration_date DATE,
  is_verified BOOLEAN,
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractor(contractor_id),
  INDEX idx_contractor_id (contractor_id)
);

-- Contractor certifications
CREATE TABLE certification (
  certification_id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  certification_type VARCHAR(100),
  provider VARCHAR(100),
  expiration_date DATE,
  is_verified BOOLEAN,
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractor(contractor_id),
  INDEX idx_contractor_id (contractor_id)
);

-- Insurance policies
CREATE TABLE insurance_policy (
  insurance_policy_id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  provider VARCHAR(100),
  policy_number VARCHAR(100),
  expiration_date DATE,
  is_verified BOOLEAN,
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractor(contractor_id),
  INDEX idx_contractor_id (contractor_id)
);

-- Device registrations for push notifications
CREATE TABLE registered_device (
  device_id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  device_type VARCHAR(50),
  os VARCHAR(50),
  notification_preferences JSON,
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractor(contractor_id),
  INDEX idx_contractor_id (contractor_id)
);

-- Tasks assigned during a job session
CREATE TABLE task (
  task_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  task_type VARCHAR(100),
  description TEXT,
  task_duration_minutes INT,
  task_quality_rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id)
);

-- Issues/blockers encountered
CREATE TABLE issue (
  issue_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  issue_category VARCHAR(100),
  issue_severity VARCHAR(50) COMMENT 'low, medium, high, critical',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id),
  INDEX idx_severity (issue_severity)
);

-- Field notes with GPS coordinates
CREATE TABLE field_note (
  note_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  note_text TEXT,
  note_latitude DECIMAL(10,8),
  note_longitude DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id)
);

-- Progress updates
CREATE TABLE progress_update (
  progress_update_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  completion_percentage INT,
  barriers_to_completion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id)
);

-- Delivery tracking
CREATE TABLE delivery (
  delivery_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  delivery_ticket_number VARCHAR(100),
  delivered_at TIMESTAMP,
  description TEXT,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id)
);

-- Photos (polymorphic: can belong to sessions, tasks, issues, deliveries)
CREATE TABLE photo (
  photo_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  photoable_type VARCHAR(50) COMMENT 'job_session, task, issue, delivery',
  photoable_id INT,
  url VARCHAR(500),
  captured_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id),
  INDEX idx_photoable (photoable_type, photoable_id)
);

-- Final work submission
CREATE TABLE submission (
  submission_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT UNIQUE NOT NULL,
  submission_status VARCHAR(50) COMMENT 'draft, pending_review, complete',
  submission_package_url VARCHAR(500),
  submitted_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id),
  INDEX idx_status (submission_status)
);

-- Invoicing and payment tracking
CREATE TABLE invoice (
  invoice_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  invoice_amount DECIMAL(10,2),
  invoice_date DATE,
  payment_status VARCHAR(50) COMMENT 'unpaid, paid, disputed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES job_session(session_id),
  INDEX idx_session_id (session_id),
  INDEX idx_payment_status (payment_status)
);
