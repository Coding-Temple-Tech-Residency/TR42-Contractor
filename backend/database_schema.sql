-- TR42 Contractor Database Schema
-- Run this in Neon SQL Editor to create all tables

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Address table (referenced by authuser, vendor, client)
CREATE TABLE address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(360),
    city VARCHAR(360),
    state VARCHAR(360),
    zip_code VARCHAR(20),
    country VARCHAR(360),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER,
    updated_by INTEGER
);

-- AuthUser table
CREATE TABLE authuser (
    id SERIAL PRIMARY KEY,
    email VARCHAR(360) UNIQUE NOT NULL,
    username VARCHAR(360) UNIQUE NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    user_type VARCHAR(360) NOT NULL, -- vendor, client, contractor
    token_version INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    profile_photo VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES authuser(id),
    updated_by INTEGER REFERENCES authuser(id),
    first_name VARCHAR(360) NOT NULL,
    last_name VARCHAR(360) NOT NULL,
    middle_name VARCHAR(360),
    contact_number VARCHAR(20) NOT NULL,
    alternate_number VARCHAR(20),
    date_of_birth DATE NOT NULL,
    ssn_last_four VARCHAR(4),
    address_id INTEGER NOT NULL REFERENCES address(id)
);

-- Add FK constraints for address table after authuser exists
ALTER TABLE address ADD CONSTRAINT fk_address_created_by 
    FOREIGN KEY (created_by) REFERENCES authuser(id);
ALTER TABLE address ADD CONSTRAINT fk_address_updated_by 
    FOREIGN KEY (updated_by) REFERENCES authuser(id);

-- Contractor table
CREATE TABLE contractor (
    id SERIAL PRIMARY KEY,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES authuser(id),
    role VARCHAR(360) NOT NULL,
    status VARCHAR(20) NOT NULL,
    tickets_completed INTEGER DEFAULT 0 NOT NULL,
    tickets_open INTEGER DEFAULT 0 NOT NULL,
    biometric_enrolled BOOLEAN DEFAULT FALSE NOT NULL,
    is_onboarded BOOLEAN DEFAULT FALSE NOT NULL,
    is_subcontractor BOOLEAN DEFAULT FALSE NOT NULL,
    is_fte BOOLEAN DEFAULT FALSE NOT NULL,
    is_licensed BOOLEAN DEFAULT FALSE NOT NULL,
    is_insured BOOLEAN DEFAULT FALSE NOT NULL,
    is_certified BOOLEAN DEFAULT FALSE NOT NULL,
    average_rating FLOAT,
    years_experience INTEGER,
    preferred_job_types VARCHAR(500),
    offline_pin VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER NOT NULL REFERENCES authuser(id),
    updated_by INTEGER REFERENCES authuser(id)
);

CREATE INDEX idx_contractor_user_id ON contractor(user_id);

-- Vendor table
CREATE TABLE vendor (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(360) NOT NULL,
    company_code VARCHAR(360) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    primary_contact_name VARCHAR(360) NOT NULL,
    company_email VARCHAR(360) NOT NULL,
    company_phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    vendor_code VARCHAR(360) UNIQUE NOT NULL,
    onboarding VARCHAR(360),
    compliance_status VARCHAR(360),
    description VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER NOT NULL REFERENCES authuser(id),
    updated_by INTEGER REFERENCES authuser(id),
    address_id INTEGER NOT NULL REFERENCES address(id)
);

-- Client table
CREATE TABLE client (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(360) NOT NULL,
    client_code VARCHAR(360) NOT NULL,
    primary_contact_name VARCHAR(360) NOT NULL,
    contact_email VARCHAR(360) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER NOT NULL REFERENCES authuser(id),
    updated_by INTEGER REFERENCES authuser(id),
    address_id INTEGER NOT NULL REFERENCES address(id)
);

-- Work Order table
CREATE TABLE work_order (
    id SERIAL PRIMARY KEY,
    assigned_vendor INTEGER NOT NULL REFERENCES vendor(id),
    client_id INTEGER NOT NULL REFERENCES client(id),
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    description VARCHAR(500) NOT NULL,
    work_order_name VARCHAR(200) NOT NULL,
    estimated_start_date DATE NOT NULL,
    estimated_end_date DATE NOT NULL,
    current_status VARCHAR(360) NOT NULL,
    location VARCHAR(500) NOT NULL,
    location_type VARCHAR(360) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    estimated_cost FLOAT NOT NULL,
    estimated_duration FLOAT NOT NULL,
    priority VARCHAR(360) NOT NULL,
    comments VARCHAR(500),
    well_id INTEGER,
    service_type VARCHAR(360),
    estimated_quantity FLOAT,
    units VARCHAR(360),
    is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
    recurrence_type VARCHAR(360),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER NOT NULL REFERENCES authuser(id),
    updated_by INTEGER REFERENCES authuser(id)
);

-- Ticket table
CREATE TABLE ticket (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_order(id),
    invoice_id INTEGER,
    vendor_id INTEGER NOT NULL REFERENCES vendor(id),
    description VARCHAR(500) NOT NULL,
    priority VARCHAR(360) NOT NULL,
    status VARCHAR(360) NOT NULL, -- to_do, in_progress, completed
    assigned_contractor INTEGER REFERENCES contractor(id),
    assigned_at TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    contractor_start_location VARCHAR(500),
    contractor_end_location VARCHAR(500),
    route VARCHAR(500),
    due_date TIMESTAMPTZ,
    estimated_duration FLOAT,
    service_type VARCHAR(360),
    estimated_quantity FLOAT,
    unit VARCHAR(360),
    special_requirements VARCHAR(500),
    notes VARCHAR(500),
    anomaly_flag BOOLEAN DEFAULT FALSE,
    anomaly_reason VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by INTEGER NOT NULL REFERENCES authuser(id),
    updated_by INTEGER REFERENCES authuser(id),
    additional_information VARCHAR(500)
);

CREATE INDEX idx_ticket_work_order_id ON ticket(work_order_id);
CREATE INDEX idx_ticket_vendor_id ON ticket(vendor_id);

-- Inspection Templates
CREATE TABLE inspection_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inspection Sections
CREATE TABLE inspection_sections (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES inspection_templates(id),
    name VARCHAR(200) NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL
);

-- Inspection Items
CREATE TABLE inspection_items (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES inspection_sections(id),
    label VARCHAR(300) NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL
);

-- Inspections (completed inspections by contractors)
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES inspection_templates(id),
    contractor_id INTEGER NOT NULL REFERENCES contractor(id),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, passed, failed, skipped
    no_issues_found BOOLEAN DEFAULT FALSE NOT NULL,
    skipped BOOLEAN DEFAULT FALSE NOT NULL,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes VARCHAR(1000)
);

-- Inspection Results
CREATE TABLE inspection_results (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspections(id),
    item_id INTEGER NOT NULL REFERENCES inspection_items(id),
    passed BOOLEAN DEFAULT TRUE NOT NULL,
    note VARCHAR(500)
);

-- Duty Sessions (FMCSA-style duty tracking)
CREATE TABLE duty_sessions (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractor(id),
    current_status VARCHAR(20) DEFAULT 'off_duty' NOT NULL, -- driving, on_duty, off_duty, sleeper_berth
    session_date DATE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Duty Logs
CREATE TABLE duty_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES duty_sessions(id),
    contractor_id INTEGER NOT NULL REFERENCES contractor(id),
    status VARCHAR(20) NOT NULL, -- driving, on_duty, off_duty, sleeper_berth
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- AI Inspection Reports (the fixed table)
CREATE TABLE ai_inspection_reports (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractor(id),
    inspection_id INTEGER REFERENCES inspections(id),
    title VARCHAR(300) NOT NULL,
    priority VARCHAR(20) NOT NULL, -- low, medium, high
    category VARCHAR(100) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    recommended_actions VARCHAR(3000) NOT NULL, -- JSON array stored as string
    raw_notes VARCHAR(2000),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_ai_reports_contractor_id ON ai_inspection_reports(contractor_id);
CREATE INDEX idx_ai_reports_inspection_id ON ai_inspection_reports(inspection_id);

-- Insert a default admin user (password: admin123 - change in production!)
-- Note: This uses a placeholder hash - replace with actual bcrypt hash
INSERT INTO address (street, city, state, zip_code, country, created_at, created_by)
VALUES ('123 Admin St', 'Admin City', 'CA', '12345', 'USA', CURRENT_TIMESTAMP, NULL)
RETURNING id;

-- Note: You need to set the created_by after authuser is created
-- For initial setup, run seed script after schema creation
