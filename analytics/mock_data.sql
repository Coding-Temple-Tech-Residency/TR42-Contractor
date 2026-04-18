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


-- CLIENTUSER (linking client users)
INSERT INTO clientuser (id, userid, clientid, createdat, updatedat, createdby, updatedby)
VALUES
('cu-001', 'usr-001', 'cli-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cu-002', 'usr-002', 'cli-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cu-003', 'usr-007', 'cli-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cu-004', 'usr-010', 'cli-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cu-005', 'usr-003', 'cli-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('cu-006', 'usr-008', 'cli-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- VENDORUSER (linking vendor users)
INSERT INTO vendoruser (id, userid, vendorid, createdat, updatedat, createdby, updatedby)
VALUES
('vu-001', 'usr-003', 'vnd-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vu-002', 'usr-008', 'vnd-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- WELLS
INSERT INTO well (id, apinumber, wellname, clientid, operator, status, type, geofenceradius, totaldepth, safetynotes, createdat, updatedat, createdby, updatedby)
VALUES
('wll-001', '42-001-00001', 'Eagle Ford Well A1', 'cli-001', 'Gulf Coast Energy', 'active', 'Oil', 500.00, 12500.00, 'High pressure zone - PPE required', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-002', '42-001-00002', 'Eagle Ford Well A2', 'cli-001', 'Gulf Coast Energy', 'active', 'Gas', 450.00, 11800.00, 'Standard operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-003', '42-001-00003', 'Goliad Field B1', 'cli-001', 'Gulf Coast Energy', 'active', 'Oil', 500.00, 13200.00, 'Sulfur present - H2S monitoring', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-004', '42-469-00001', 'Coastal Rig Site 1', 'cli-002', 'Coastal Oil & Gas', 'active', 'Oil', 600.00, 14500.00, 'Offshore proximity - weather monitoring', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-005', '42-469-00002', 'Coastal Rig Site 2', 'cli-002', 'Coastal Oil & Gas', 'inactive', 'Gas', 550.00, 13000.00, 'Under maintenance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wll-006', '22-037-00001', 'Cameron Field C1', 'cli-003', 'Offshore Operations Inc', 'active', 'Oil', 700.00, 15000.00, 'Deep water operations - specialized equipment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- WELL LOCATIONS
INSERT INTO welllocation (id, wellid, surfacelatitude, surfacelongitude, county, state, fieldname, createdat, updatedat, createdby, updatedby)
VALUES
('wl-001', 'wll-001', 28.7543, -98.4567, 'Webb', 'TX', 'Eagle Ford', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wl-002', 'wll-002', 28.7612, -98.4623, 'Webb', 'TX', 'Eagle Ford', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wl-003', 'wll-003', 28.6523, -98.1234, 'Goliad', 'TX', 'Goliad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wl-004', 'wll-004', 27.8123, -97.3876, 'San Patricio', 'TX', 'Coastal Bend', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wl-005', 'wll-005', 27.8234, -97.3912, 'San Patricio', 'TX', 'Coastal Bend', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('wl-006', 'wll-006', 29.8912, -93.4567, 'Cameron', 'LA', 'Cameron Field', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- VENDORWELL (vendor-to-well mapping)
INSERT INTO vendorwell (id, vendorid, wellid, createdat, updatedat, createdby, updatedby)
VALUES
('vw-001', 'vnd-001', 'wll-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-002', 'vnd-001', 'wll-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-003', 'vnd-001', 'wll-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-004', 'vnd-002', 'wll-004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-005', 'vnd-002', 'wll-005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001'),
('vw-006', 'vnd-003', 'wll-006', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-001', 'usr-001');

-- WORKORDERS
INSERT INTO workorders (id, workordername, clientid, vendorid, wellid, description, startdate, enddate, isrecurring, recurrencyfrequency, status, createdat, updatedat, createdby, updatedby)
VALUES
('wo-001', 'Eagle Ford Pipeline Inspection Q1', 'cli-001', 'vnd-001', 'wll-001', 'Quarterly pipeline inspection and maintenance', '2025-01-06', '2025-01-20', TRUE, 'Quarterly', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-002', 'usr-002'),
('wo-002', 'Eagle Ford Well A2 Maintenance', 'cli-001', 'vnd-001', 'wll-002', 'Routine well maintenance and equipment check', '2025-01-15', '2025-01-28', FALSE, NULL, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-002', 'usr-002'),
('wo-003', 'Goliad Field Emergency Response', 'cli-001', 'vnd-001', 'wll-003', 'Emergency response for H2S leak detection', '2025-02-10', '2025-02-15', FALSE, NULL, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-002', 'usr-002'),
('wo-004', 'Coastal Rig Site Equipment Install', 'cli-002', 'vnd-002', 'wll-004', 'New pump and valve installation', '2025-02-20', '2025-03-10', FALSE, NULL, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-007', 'usr-007'),
('wo-005', 'Coastal Rig Site 2 Pipeline Inspection', 'cli-002', 'vnd-002', 'wll-005', 'Annual pipeline inspection', '2025-03-01', '2025-03-15', TRUE, 'Annually', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-007', 'usr-007'),
('wo-006', 'Cameron Field Deep Well Audit', 'cli-003', 'vnd-003', 'wll-006', 'Comprehensive well audit and safety inspection', '2025-03-10', '2025-03-25', FALSE, NULL, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('wo-007', 'Eagle Ford Well A1 Follow-up', 'cli-001', 'vnd-001', 'wll-001', 'Follow-up inspection after Q1 findings', '2025-04-01', '2025-04-10', FALSE, NULL, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-002', 'usr-002'),
('wo-008', 'Gulf Coast Safety Audit Q2', 'cli-001', 'vnd-001', 'wll-002', 'Quarterly safety audit across all sites', '2025-04-05', '2025-04-20', TRUE, 'Quarterly', 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-002', 'usr-002');

-- TICKETS
INSERT INTO tickets (id, workorderid, vendorid, contractorid, ticketnumber, description, route, pickuplocation, deliverylocation, servicetype, freightamount, fuelcost, status, paymentstatus, pickupdatetime, deliverydatetime, geofenceverified, biometricverified, createdat, updatedat, createdby, updatedby)
VALUES
('tkt-001', 'wo-001', 'vnd-001', 'ctr-001', 'TKT-2025-0001', 'Pipeline equipment delivery to Well A1', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Eagle Ford Well A1, Webb County, TX', 'Pipeline Inspection', 2500.00, 450.00, 'completed', 'paid', '2025-01-07 06:00:00', '2025-01-07 14:30:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-002', 'wo-001', 'vnd-001', 'ctr-002', 'TKT-2025-0002', 'Safety equipment transport for inspection', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Eagle Ford Well A1, Webb County, TX', 'Pipeline Inspection', 1800.00, 380.00, 'completed', 'paid', '2025-01-08 07:00:00', '2025-01-08 15:00:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-003', 'wo-001', 'vnd-001', 'ctr-001', 'TKT-2025-0003', 'Return transport of inspection equipment', 'Hot Shot Delivery', 'Eagle Ford Well A1, Webb County, TX', '123 Service Rd, Galveston, TX 77550', 'Pipeline Inspection', 1500.00, 350.00, 'completed', 'paid', '2025-01-20 08:00:00', '2025-01-20 16:00:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-004', 'wo-002', 'vnd-001', 'ctr-002', 'TKT-2025-0004', 'Well maintenance supplies delivery', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Eagle Ford Well A2, Webb County, TX', 'Well Maintenance', 3200.00, 520.00, 'completed', 'paid', '2025-01-16 06:30:00', '2025-01-16 15:00:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-005', 'wo-002', 'vnd-001', 'ctr-001', 'TKT-2025-0005', 'Replacement parts for Well A2', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Eagle Ford Well A2, Webb County, TX', 'Well Maintenance', 2800.00, 480.00, 'completed', 'paid', '2025-01-22 07:00:00', '2025-01-22 14:30:00', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-006', 'wo-003', 'vnd-001', 'ctr-003', 'TKT-2025-0006', 'Emergency H2S monitoring equipment', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Goliad Field B1, Goliad County, TX', 'Emergency Response', 4500.00, 680.00, 'completed', 'paid', '2025-02-10 05:00:00', '2025-02-10 11:00:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-007', 'wo-003', 'vnd-001', 'ctr-002', 'TKT-2025-0007', 'Safety team transport to Goliad', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Goliad Field B1, Goliad County, TX', 'Emergency Response', 3000.00, 550.00, 'completed', 'paid', '2025-02-10 06:00:00', '2025-02-10 12:30:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-008', 'wo-004', 'vnd-002', 'ctr-003', 'TKT-2025-0008', 'Pump equipment delivery to Coastal Rig', 'Hot Shot Delivery', '2500 Harbor Dr, Corpus Christi, TX', 'Coastal Rig Site 1, San Patricio County, TX', 'Equipment Installation', 5500.00, 720.00, 'in_transit', 'pending', '2025-03-05 06:00:00', NULL, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('tkt-009', 'wo-004', 'vnd-002', 'ctr-003', 'TKT-2025-0009', 'Valve assembly transport', 'Hot Shot Delivery', '2500 Harbor Dr, Corpus Christi, TX', 'Coastal Rig Site 1, San Patricio County, TX', 'Equipment Installation', 4200.00, 650.00, 'accepted', 'pending', '2025-03-08 07:00:00', NULL, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('tkt-010', 'wo-005', 'vnd-002', 'ctr-003', 'TKT-2025-0010', 'Pipeline inspection tools delivery', 'Hot Shot Delivery', '2500 Harbor Dr, Corpus Christi, TX', 'Coastal Rig Site 2, San Patricio County, TX', 'Pipeline Inspection', 3800.00, 580.00, 'completed', 'paid', '2025-03-02 06:30:00', '2025-03-02 14:00:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('tkt-011', 'wo-005', 'vnd-002', 'ctr-003', 'TKT-2025-0011', 'Return of inspection equipment', 'Hot Shot Delivery', 'Coastal Rig Site 2, San Patricio County, TX', '2500 Harbor Dr, Corpus Christi, TX', 'Pipeline Inspection', 2200.00, 450.00, 'completed', 'paid', '2025-03-15 08:00:00', '2025-03-15 15:30:00', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('tkt-012', 'wo-006', 'vnd-003', 'ctr-003', 'TKT-2025-0012', 'Deep well audit equipment to Cameron', 'Hot Shot Delivery', '500 Offshore Way, Lafayette, LA', 'Cameron Field C1, Cameron Parish, LA', 'Safety Audit', 6500.00, 890.00, 'arrived', 'pending', '2025-03-12 05:00:00', NULL, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('tkt-013', 'wo-007', 'vnd-001', NULL, 'TKT-2025-0013', 'Follow-up inspection materials', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Eagle Ford Well A1, Webb County, TX', 'Pipeline Inspection', 2000.00, 400.00, 'assigned', 'pending', NULL, NULL, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('tkt-014', 'wo-008', 'vnd-001', NULL, 'TKT-2025-0014', 'Q2 Safety audit equipment', 'Hot Shot Delivery', '123 Service Rd, Galveston, TX 77550', 'Eagle Ford Well A2, Webb County, TX', 'Safety Audit', 3500.00, 520.00, 'assigned', 'pending', NULL, NULL, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003');

-- INVOICES
INSERT INTO invoices (id, ticketid, workorderid, vendorid, clientid, invoicenumber, totalamount, subtotal, taxamount, duedate, status, paymentterms, notes, createdat, updatedat, createdby, updatedby)
VALUES
('inv-001', 'tkt-001', 'wo-001', 'vnd-001', 'cli-001', 'INV-2025-0001', 2950.00, 2500.00, 450.00, '2025-02-06', 'paid', 'NET30', 'Pipeline inspection delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-002', 'tkt-002', 'wo-001', 'vnd-001', 'cli-001', 'INV-2025-0002', 2180.00, 1800.00, 380.00, '2025-02-08', 'paid', 'NET30', 'Safety equipment transport', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-003', 'tkt-003', 'wo-001', 'vnd-001', 'cli-001', 'INV-2025-0003', 1850.00, 1500.00, 350.00, '2025-02-20', 'paid', 'NET30', 'Return transport', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-004', 'tkt-004', 'wo-002', 'vnd-001', 'cli-001', 'INV-2025-0004', 3720.00, 3200.00, 520.00, '2025-02-16', 'paid', 'NET30', 'Well maintenance supplies', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-005', 'tkt-005', 'wo-002', 'vnd-001', 'cli-001', 'INV-2025-0005', 3280.00, 2800.00, 480.00, '2025-02-22', 'paid', 'NET30', 'Replacement parts delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-006', 'tkt-006', 'wo-003', 'vnd-001', 'cli-001', 'INV-2025-0006', 5180.00, 4500.00, 680.00, '2025-03-10', 'paid', 'NET15', 'Emergency H2S response', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-007', 'tkt-007', 'wo-003', 'vnd-001', 'cli-001', 'INV-2025-0007', 3550.00, 3000.00, 550.00, '2025-03-10', 'paid', 'NET15', 'Safety team transport', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('inv-008', 'tkt-008', 'wo-004', 'vnd-002', 'cli-002', 'INV-2025-0008', 6220.00, 5500.00, 720.00, '2025-04-05', 'pending', 'NET30', 'Pump equipment delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('inv-009', 'tkt-009', 'wo-004', 'vnd-002', 'cli-002', 'INV-2025-0009', 4850.00, 4200.00, 650.00, '2025-04-08', 'pending', 'NET30', 'Valve assembly transport', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('inv-010', 'tkt-010', 'wo-005', 'vnd-002', 'cli-002', 'INV-2025-0010', 4380.00, 3800.00, 580.00, '2025-04-02', 'paid', 'NET30', 'Inspection tools delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('inv-011', 'tkt-011', 'wo-005', 'vnd-002', 'cli-002', 'INV-2025-0011', 2650.00, 2200.00, 450.00, '2025-04-15', 'paid', 'NET30', 'Return inspection equipment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008'),
('inv-012', 'tkt-012', 'wo-006', 'vnd-003', 'cli-003', 'INV-2025-0012', 7390.00, 6500.00, 890.00, '2025-04-12', 'pending', 'NET30', 'Deep well audit equipment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008');

-- LINE ITEMS
INSERT INTO lineitems (id, invoiceid, description, quantity, unitprice, lineamount, createdat, updatedat, createdby, updatedby)
VALUES
('li-001', 'inv-001', 'Hot Shot Delivery Service', 1.00, 2500.00, 2500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('li-002', 'inv-002', 'Safety Equipment Transport', 1.00, 1800.00, 1800.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('li-003', 'inv-003', 'Return Transport Service', 1.00, 1500.00, 1500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('li-004', 'inv-004', 'Well Maintenance Supplies', 1.00, 3200.00, 3200.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('li-005', 'inv-006', 'Emergency Response Service', 1.00, 4500.00, 4500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-003', 'usr-003'),
('li-006', 'inv-010', 'Pipeline Inspection Tools', 1.00, 3800.00, 3800.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'usr-008', 'usr-008');

-- CONTRACTOR PERFORMANCE
INSERT INTO contractorperformance (id, ticketid, contractorid, rating, ontime, qualityscore, safetycompliant, notes, ratedby, createdat)
VALUES
('cp-001', 'tkt-001', 'ctr-001', 4.8, TRUE, 4.7, TRUE, 'Excellent delivery, arrived ahead of schedule', 'usr-002', CURRENT_TIMESTAMP),
('cp-002', 'tkt-002', 'ctr-002', 4.5, TRUE, 4.5, TRUE, 'Good performance, minor delay in communication', 'usr-002', CURRENT_TIMESTAMP),
('cp-003', 'tkt-003', 'ctr-001', 5.0, TRUE, 5.0, TRUE, 'Outstanding service, zero issues', 'usr-002', CURRENT_TIMESTAMP),
('cp-004', 'tkt-004', 'ctr-002', 4.3, TRUE, 4.2, TRUE, 'Reliable delivery, good condition', 'usr-002', CURRENT_TIMESTAMP),
('cp-005', 'tkt-005', 'ctr-001', 4.0, FALSE, 4.0, TRUE, 'Delivery delayed by 2 hours due to weather', 'usr-002', CURRENT_TIMESTAMP),
('cp-006', 'tkt-006', 'ctr-003', 4.9, TRUE, 4.9, TRUE, 'Critical emergency response handled professionally', 'usr-002', CURRENT_TIMESTAMP),
('cp-007', 'tkt-007', 'ctr-002', 4.6, TRUE, 4.6, TRUE, 'Solid emergency response support', 'usr-002', CURRENT_TIMESTAMP),
('cp-008', 'tkt-010', 'ctr-003', 4.7, TRUE, 4.8, TRUE, 'Consistent quality on recurring delivery', 'usr-007', CURRENT_TIMESTAMP),
('cp-009', 'tkt-011', 'ctr-003', 4.5, TRUE, 4.4, TRUE, 'Good return delivery, equipment intact', 'usr-007', CURRENT_TIMESTAMP);
