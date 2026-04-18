-- ============================================================
-- TR42 Contractor Mobile App - Mock/Seed Data
-- Sprint 2-3: Data Design + Mock Dashboard
-- Based on: Vendor Database ERD (dbdiagram.io)
-- Team: TR42 Contractor Team (Team B)
-- ============================================================

-- ============================================================
-- PART 1: USERS & CORE ENTITIES
-- ============================================================

-- USERS
INSERT INTO users (id, email, username, passwordhash, usertype, role, firstname, lastname, phone, status, tokenversion, createdat, updatedat)
VALUES
('usr-001', 'admin@tr42contractor.com', 'admin', '$2b$10$hashedpassword1', 'client', 'admin', 'System', 'Administrator', '555-000-0000', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-002', 'john.smith@gulfcoast.com', 'jsmith', '$2b$10$hashedpassword2', 'client', 'manager', 'John', 'Smith', '555-111-0001', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-003', 'sarah.jones@coastalservices.com', 'sjones', '$2b$10$hashedpassword3', 'vendor', 'manager', 'Sarah', 'Jones', '555-222-0002', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-004', 'mike.wilson@coastalservices.com', 'mwilson', '$2b$10$hashedpassword4', 'contractor', 'user', 'Mike', 'Wilson', '555-333-0003', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-005', 'lisa.garcia@coastalservices.com', 'lgarcia', '$2b$10$hashedpassword5', 'contractor', 'user', 'Lisa', 'Garcia', '555-444-0004', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-006', 'david.lee@coastalservices.com', 'dlee', '$2b$10$hashedpassword6', 'contractor', 'user', 'David', 'Lee', '555-555-0005', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-007', 'james.brown@gulfcoast.com', 'jbrown', '$2b$10$hashedpassword7', 'client', 'user', 'James', 'Brown', '555-666-0006', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-008', 'emily.davis@offshoreops.com', 'edavis', '$2b$10$hashedpassword8', 'vendor', 'manager', 'Emily', 'Davis', '555-777-0007', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-009', 'robert.miller@offshoreops.com', 'rmiller', '$2b$10$hashedpassword9', 'contractor', 'user', 'Robert', 'Miller', '555-888-0008', 'inactive', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-010', 'jennifer.taylor@gulfcoast.com', 'jtaylor', '$2b$10$hashedpassword10', 'client', 'admin', 'Jennifer', 'Taylor', '555-999-0009', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- CLIENTS
INSERT INTO client (id, companyname, companyphone, companyemail, address, createdat, updatedat, createdby, updatedby)
VALUES
('cli-001', 'Gulf Coast Energy', '555-100-1000', 'contact@gulfcoast.com', '1000 Energy Blvd, Houston, TX 77002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cli-002', 'Coastal Oil & Gas', '555-200-2000', 'info@coastaloil.com', '2500 Harbor Dr, Corpus Christi, TX 78401', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cli-003', 'Offshore Operations Inc', '555-300-3000', 'support@offshoreops.com', '500 Offshore Way, Lafayette, LA 70501', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- VENDORS
INSERT INTO vendor (id, vendorname, contactname, contactemail, contactphone, address, specialty, status, createdat, updatedat, createdby, updatedby)
VALUES
('vnd-001', 'Coastal Maintenance Services', 'Sarah Jones', 'sarah.jones@coastalservices.com', '555-222-0002', '123 Service Rd, Galveston, TX 77550', 'Pipeline Maintenance', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vnd-002', 'Offshore Industrial Supply', 'Emily Davis', 'emily.davis@offshoreops.com', '555-777-0007', '789 Industrial Ave, New Orleans, LA 70112', 'Equipment Supply', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vnd-003', 'Gulf Marine Contractors', 'Tom Anderson', 'tom.anderson@gulfmarine.com', '555-444-1111', '456 Marine Dr, Mobile, AL 36602', 'Marine Construction', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- CLIENTUSER (client-users mapping)
INSERT INTO clientuser (id, clientid, userid, role, createdat)
VALUES
('cu-001', 'cli-001', 'usr-002', 'manager', CURRENT_TIMESTAMP),
('cu-002', 'cli-001', 'usr-007', 'user', CURRENT_TIMESTAMP),
('cu-003', 'cli-001', 'usr-010', 'admin', CURRENT_TIMESTAMP),
('cu-004', 'cli-002', 'usr-002', 'manager', CURRENT_TIMESTAMP),
('cu-005', 'cli-003', 'usr-010', 'admin', CURRENT_TIMESTAMP);

-- VENDORUSER (vendor-users mapping)
INSERT INTO vendoruser (id, vendorid, userid, role, createdat)
VALUES
('vu-001', 'vnd-001', 'usr-003', 'manager', CURRENT_TIMESTAMP),
('vu-002', 'vnd-002', 'usr-008', 'manager', CURRENT_TIMESTAMP),
('vu-003', 'vnd-001', 'usr-004', 'contractor', CURRENT_TIMESTAMP),
('vu-004', 'vnd-001', 'usr-005', 'contractor', CURRENT_TIMESTAMP),
('vu-005', 'vnd-002', 'usr-006', 'contractor', CURRENT_TIMESTAMP);

-- ============================================================
-- PART 2: LOCATION & SERVICE TABLES
-- ============================================================

-- WELLS
INSERT INTO well (id, clientid, wellname, wellnumber, welltype, status, latitude, longitude, depth, createdat, updatedat, createdby, updatedby)
VALUES
('wll-001', 'cli-001', 'Gulf Platform Alpha', 'GPA-001', 'offshore', 'active', 28.7041, -94.7977, 15000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-002', 'cli-001', 'Gulf Platform Beta', 'GPB-002', 'offshore', 'active', 28.6543, -94.8234, 14500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-003', 'cli-002', 'Coastal Field 1', 'CF-001', 'onshore', 'active', 27.8006, -97.3964, 8000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-004', 'cli-003', 'Offshore Site Charlie', 'OSC-001', 'offshore', 'maintenance', 29.9511, -90.0715, 12000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-005', 'cli-003', 'Offshore Site Delta', 'OSD-002', 'offshore', 'active', 29.8765, -89.9876, 13500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- WELL LOCATIONS
INSERT INTO welllocation (id, wellid, locationname, address, city, state, zipcode, country, createdat, updatedat, createdby, updatedby)
VALUES
('wloc-001', 'wll-001', 'Gulf of Mexico - Block A', 'Offshore', 'Houston', 'TX', '77002', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wloc-002', 'wll-002', 'Gulf of Mexico - Block B', 'Offshore', 'Houston', 'TX', '77002', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wloc-003', 'wll-003', 'Coastal Bend', '2500 Harbor Dr', 'Corpus Christi', 'TX', '78401', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wloc-004', 'wll-004', 'Mississippi Canyon', 'Offshore', 'New Orleans', 'LA', '70112', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wloc-005', 'wll-005', 'South Pass', 'Offshore', 'Lafayette', 'LA', '70501', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- VENDORWELL (vendor-well assignments)
INSERT INTO vendorwell (id, vendorid, wellid, assignmentdate, status, createdat, updatedat, createdby, updatedby)
VALUES
('vw-001', 'vnd-001', 'wll-001', DATE '2025-01-15', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-002', 'vnd-001', 'wll-002', DATE '2025-02-01', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-003', 'vnd-002', 'wll-003', DATE '2025-03-10', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-004', 'vnd-003', 'wll-004', DATE '2025-04-05', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-005', 'vnd-003', 'wll-005', DATE '2025-04-10', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- SERVICES
INSERT INTO services (serviceid, service, createdat, updatedat, createdby, updatedby)
VALUES
('svc-001', 'Pipeline Inspection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('svc-002', 'Well Maintenance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('svc-003', 'Equipment Installation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('svc-004', 'Safety Audit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('svc-005', 'Emergency Response', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('svc-006', 'Environmental Testing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- VENDORSERVICES (vendor-service mapping)
INSERT INTO vendorservices (id, vendorid, serviceid, createdat, updatedat, createdby, updatedby)
VALUES
('vs-001', 'vnd-001', 'svc-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vs-002', 'vnd-001', 'svc-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vs-003', 'vnd-001', 'svc-004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vs-004', 'vnd-002', 'svc-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vs-005', 'vnd-002', 'svc-005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vs-006', 'vnd-003', 'svc-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vs-007', 'vnd-003', 'svc-006', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- CONTRACTORS
INSERT INTO contractor (id, userid, vendorid, vendormanagerid, employeetype, cdl_number, cdl_expiry, dot_number, status, createdat, updatedat, createdby, updatedby)
VALUES
('ctr-001', 'usr-004', 'vnd-001', 'usr-003', 'fulltime', 'CDL-TX-123456', DATE '2027-06-15', 'DOT-12345', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('ctr-002', 'usr-005', 'vnd-001', 'usr-003', 'fulltime', 'CDL-TX-234567', DATE '2027-08-20', 'DOT-12345', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('ctr-003', 'usr-006', 'vnd-002', 'usr-008', 'independent', 'CDL-LA-345678', DATE '2026-12-01', 'DOT-67890', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('ctr-004', 'usr-009', 'vnd-002', 'usr-008', 'fulltime', 'CDL-LA-456789', DATE '2025-03-15', 'DOT-67890', 'inactive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008');
