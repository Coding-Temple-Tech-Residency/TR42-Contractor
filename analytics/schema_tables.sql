-- ============================================================
-- TR42 Contractor Mobile App - Database Schema (PostgreSQL)
-- Sprint 2-3: Data Design + Mock Dashboard
-- Updated to match LIVE BACKEND table names (from backend/app/models.py)
-- Team: TR42 Contractor Team (Team B)
-- ============================================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS duty_logs CASCADE;
DROP TABLE IF EXISTS duty_sessions CASCADE;
DROP TABLE IF EXISTS inspection_results CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS inspection_items CASCADE;
DROP TABLE IF EXISTS inspection_sections CASCADE;
DROP TABLE IF EXISTS inspection_templates CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS auth_users CASCADE;
DROP TABLE IF EXISTS lineitems CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS fraudalerts CASCADE;
DROP TABLE IF EXISTS compliancedocuments CASCADE;
DROP TABLE IF EXISTS msa CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat CASCADE;

-- ============================================================
-- PART 1: CORE ENTITY TABLES
-- ============================================================

-- AUTH_USERS TABLE (was: users)
CREATE TABLE auth_users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'vendor', 'contractor')),
    is_active BOOLEAN DEFAULT TRUE,
    profile_photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- CLIENTS TABLE (was: client)
CREATE TABLE clients (
    id INTEGER PRIMARY KEY REFERENCES auth_users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- VENDORS TABLE (was: vendor)
CREATE TABLE vendors (
    id INTEGER PRIMARY KEY REFERENCES auth_users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- CONTRACTORS TABLE (was: contractor)
CREATE TABLE contractors (
    id INTEGER PRIMARY KEY REFERENCES auth_users(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    manager_id INTEGER NOT NULL REFERENCES auth_users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    contractor_type TEXT NOT NULL,
    status TEXT NOT NULL,
    tax_classification TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- ============================================================
-- PART 2: INSPECTION TABLES (NEW - 8 tables)
-- ============================================================

-- INSPECTION_TEMPLATES
CREATE TABLE inspection_templates (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- INSPECTION_SECTIONS
CREATE TABLE inspection_sections (
    id INTEGER PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES inspection_templates(id),
    section_name TEXT NOT NULL,
    section_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- INSPECTION_ITEMS
CREATE TABLE inspection_items (
    id INTEGER PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES inspection_sections(id),
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('pass_fail', 'numeric', 'text', 'photo', 'signature')),
    is_required BOOLEAN DEFAULT TRUE,
    item_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- INSPECTIONS
CREATE TABLE inspections (
    id INTEGER PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
    contractor_id INTEGER NOT NULL REFERENCES contractors(id),
    template_id INTEGER REFERENCES inspection_templates(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    scheduled_date DATE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    overall_score NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- INSPECTION_RESULTS
CREATE TABLE inspection_results (
    id INTEGER PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspections(id),
    item_id INTEGER NOT NULL REFERENCES inspection_items(id),
    result_value TEXT,
    numeric_value NUMERIC(10,2),
    pass_fail BOOLEAN,
    notes TEXT,
    photo_url TEXT,
    signature_url TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id)
);

-- AI_INSPECTION_REPORTS
CREATE TABLE ai_inspection_reports (
    id INTEGER PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspections(id),
    report_type TEXT NOT NULL CHECK (report_type IN ('summary', 'detailed', 'anomaly', 'compliance')),
    ai_model TEXT,
    confidence_score NUMERIC(5,2),
    findings_summary TEXT,
    recommendations TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id)
);

-- ============================================================
-- PART 3: DUTY LOGGING TABLES (NEW)
-- ============================================================

-- DUTY_SESSIONS
CREATE TABLE duty_sessions (
    id INTEGER PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id),
    work_order_id INTEGER REFERENCES work_orders(id),
    session_type TEXT NOT NULL CHECK (session_type IN ('driving', 'on_duty', 'off_duty', 'sleeper')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    total_distance NUMERIC(10,2),
    odometer_start NUMERIC(10,2),
    odometer_end NUMERIC(10,2),
    is_compliant BOOLEAN DEFAULT TRUE,
    violation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- DUTY_LOGS
CREATE TABLE duty_logs (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES duty_sessions(id),
    log_time TIMESTAMP NOT NULL,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    speed NUMERIC(5,2),
    event_type TEXT NOT NULL CHECK (event_type IN ('location_update', 'status_change', 'violation', 'break')),
    notes TEXT,
    created_by INTEGER REFERENCES auth_users(id)
);

-- ============================================================
-- PART 4: OPERATIONAL TABLES
-- ============================================================

-- WORK_ORDERS TABLE (was: workorders)
CREATE TABLE work_orders (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    description TEXT,
    start_date DATE,
    end_date DATE,
    current_status TEXT NOT NULL CHECK (current_status IN ('open', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_vendor INTEGER REFERENCES vendors(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- TICKETS TABLE
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    assigned_contractor INTEGER REFERENCES contractors(id),
    ticket_number TEXT NOT NULL UNIQUE,
    description TEXT,
    route TEXT,
    pickup_location TEXT,
    delivery_location TEXT,
    service_type TEXT,
    freight_amount NUMERIC(12,2),
    fuel_cost NUMERIC(12,2),
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_transit', 'arrived', 'completed', 'rejected', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed', 'overdue')),
    pickup_datetime TIMESTAMP,
    delivery_datetime TIMESTAMP,
    geofence_verified BOOLEAN DEFAULT FALSE,
    biometric_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- INVOICES TABLE
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id),
    work_order_id INTEGER REFERENCES work_orders(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    invoice_number TEXT NOT NULL UNIQUE,
    total_amount NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2),
    tax_amount NUMERIC(12,2),
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'disputed', 'rejected', 'overdue')),
    payment_terms TEXT DEFAULT 'NET30',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- LINEITEMS TABLE
CREATE TABLE lineitems (
    id INTEGER PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    description TEXT NOT NULL,
    quantity NUMERIC(10,2),
    unit_price NUMERIC(12,2),
    line_amount NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- ============================================================
-- PART 5: SUPPORTING TABLES
-- ============================================================

-- FRAUDALERTS TABLE
CREATE TABLE fraudalerts (
    id INTEGER PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id),
    ticket_id INTEGER REFERENCES tickets(id),
    invoice_id INTEGER REFERENCES invoices(id),
    alert_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    status TEXT DEFAULT 'open',
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES auth_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- COMPLIANCEDOCUMENTS TABLE
CREATE TABLE compliancedocuments (
    id INTEGER PRIMARY KEY,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    entity_type TEXT,
    expiration_date DATE,
    status TEXT DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES auth_users(id),
    reviewed_by INTEGER REFERENCES auth_users(id),
    reviewed_at TIMESTAMP
);

-- MSA TABLE
CREATE TABLE msa (
    id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    msa_number TEXT NOT NULL UNIQUE,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    document_url TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- SESSIONS TABLE
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id),
    device_token TEXT,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MESSAGES TABLE
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    sender INTEGER NOT NULL REFERENCES auth_users(id),
    recipient INTEGER NOT NULL REFERENCES auth_users(id),
    chat_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- CHAT TABLE
CREATE TABLE chat (
    chat_id TEXT PRIMARY KEY,
    participant1 INTEGER NOT NULL REFERENCES auth_users(id),
    participant2 INTEGER NOT NULL REFERENCES auth_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth_users(id),
    updated_by INTEGER REFERENCES auth_users(id)
);

-- ============================================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_auth_users_email ON auth_users(email);
CREATE INDEX idx_auth_users_role ON auth_users(role);
CREATE INDEX idx_contractors_vendor ON contractors(vendor_id);
CREATE INDEX idx_contractors_status ON contractors(status);
CREATE INDEX idx_vendors_id ON vendors(id);
CREATE INDEX idx_work_orders_status ON work_orders(current_status);
CREATE INDEX idx_work_orders_vendor ON work_orders(assigned_vendor);
CREATE INDEX idx_tickets_contractor ON tickets(assigned_contractor);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_vendor ON tickets(vendor_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX idx_inspections_contractor ON inspections(contractor_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_duty_sessions_contractor ON duty_sessions(contractor_id);
CREATE INDEX idx_duty_logs_session ON duty_logs(session_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
