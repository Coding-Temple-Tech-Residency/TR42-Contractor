-- ============================================================
-- TR42 Contractor Mobile App - Database Schema (PostgreSQL)
-- Sprint 2-3: Data Design + Mock Dashboard
-- Based on: Vendor Database ERD (dbdiagram.io)
-- Team: TR42 Contractor Team (Team B)
-- ============================================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS vendor CASCADE;
DROP TABLE IF EXISTS contractor CASCADE;
DROP TABLE IF EXISTS clientuser CASCADE;
DROP TABLE IF EXISTS vendoruser CASCADE;
DROP TABLE IF EXISTS well CASCADE;
DROP TABLE IF EXISTS welllocation CASCADE;
DROP TABLE IF EXISTS vendorwell CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS vendorservices CASCADE;
DROP TABLE IF EXISTS workorders CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS lineitems CASCADE;
DROP TABLE IF EXISTS biometric CASCADE;
DROP TABLE IF EXISTS insurance CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS backgroundchecks CASCADE;
DROP TABLE IF EXISTS drugtests CASCADE;
DROP TABLE IF EXISTS contractorperformance CASCADE;
DROP TABLE IF EXISTS address CASCADE;
DROP TABLE IF EXISTS registereddevices CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS jobsessions CASCADE;
DROP TABLE IF EXISTS deliverysubmissions CASCADE;
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

-- USERS TABLE
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    passwordhash TEXT NOT NULL,
    usertype TEXT NOT NULL CHECK (usertype IN ('client', 'vendor', 'contractor')),
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'offboarded')),
    tokenversion INTEGER DEFAULT 0,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- CLIENT TABLE
CREATE TABLE client (
    id TEXT PRIMARY KEY,
    companyname TEXT NOT NULL,
    companyphone TEXT,
    companyemail TEXT NOT NULL,
    address TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- VENDOR TABLE
CREATE TABLE vendor (
    id TEXT PRIMARY KEY,
    companyname TEXT NOT NULL,
    companyphone TEXT,
    companyemail TEXT NOT NULL,
    servicetype TEXT,
    address TEXT,
    msastatus TEXT DEFAULT 'pending' CHECK (msastatus IN ('pending', 'approved', 'expired', 'rejected')),
    msadocurl TEXT,
    trustscore NUMERIC(3,2) DEFAULT 1.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'offboarded')),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- CLIENTUSER TABLE (1:1 with users)
CREATE TABLE clientuser (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL UNIQUE REFERENCES users(id),
    clientid TEXT NOT NULL REFERENCES client(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- VENDORUSER TABLE (1:1 with users)
CREATE TABLE vendoruser (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL UNIQUE REFERENCES users(id),
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- CONTRACTOR TABLE
CREATE TABLE contractor (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL UNIQUE REFERENCES users(id),
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    vendormanagerid TEXT REFERENCES vendoruser(id),
    employeetype TEXT CHECK (employeetype IN ('independent', 'fulltime')),
    cdl_number TEXT,
    cdl_expiry DATE,
    dot_number TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'offboarded')),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- ============================================================
-- PART 2: LOCATION & SERVICE TABLES
-- ============================================================

CREATE TABLE well (
    id TEXT PRIMARY KEY,
    apinumber TEXT NOT NULL UNIQUE,
    wellname TEXT NOT NULL,
    clientid TEXT NOT NULL REFERENCES client(id),
    operator TEXT,
    status TEXT DEFAULT 'active',
    type TEXT,
    geofenceradius NUMERIC(10,2),
    totaldepth NUMERIC(10,2),
    safetynotes TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE welllocation (
    id TEXT PRIMARY KEY,
    wellid TEXT NOT NULL REFERENCES well(id),
    surfacelatitude NUMERIC(10,6),
    surfacelongitude NUMERIC(10,6),
    county TEXT,
    state TEXT,
    fieldname TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE vendorwell (
    id TEXT PRIMARY KEY,
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    wellid TEXT NOT NULL REFERENCES well(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE services (
    serviceid TEXT PRIMARY KEY,
    service TEXT NOT NULL UNIQUE,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE vendorservices (
    id TEXT PRIMARY KEY,
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    serviceid TEXT NOT NULL REFERENCES services(serviceid),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- ============================================================
-- PART 3: OPERATIONAL TABLES
-- ============================================================

CREATE TABLE workorders (
    id TEXT PRIMARY KEY,
    workordername TEXT NOT NULL UNIQUE,
    clientid TEXT NOT NULL REFERENCES client(id),
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    wellid TEXT REFERENCES well(id),
    description TEXT,
    startdate DATE,
    enddate DATE,
    isrecurring BOOLEAN DEFAULT FALSE,
    recurrencyfrequency TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    workorderid TEXT NOT NULL REFERENCES workorders(id),
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    contractorid TEXT REFERENCES contractor(id),
    ticketnumber TEXT NOT NULL,
    description TEXT,
    route TEXT CHECK (route IN ('Hot Shot Delivery', 'Water Hauler', 'Roustabout', 'Wire Line', 'Pipe Inspection', 'Cementing')),
    pickuplocation TEXT,
    deliverylocation TEXT,
    servicetype TEXT,
    freightamount NUMERIC(12,2),
    fuelcost NUMERIC(12,2),
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_transit', 'arrived', 'completed', 'rejected', 'cancelled')),
    paymentstatus TEXT DEFAULT 'pending' CHECK (paymentstatus IN ('pending', 'paid', 'disputed', 'overdue')),
    pickupdatetime TIMESTAMP,
    deliverydatetime TIMESTAMP,
    geofenceverified BOOLEAN DEFAULT FALSE,
    biometricverified BOOLEAN DEFAULT FALSE,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    ticketid TEXT REFERENCES tickets(id),
    workorderid TEXT REFERENCES workorders(id),
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    clientid TEXT NOT NULL REFERENCES client(id),
    invoicenumber TEXT NOT NULL UNIQUE,
    totalamount NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2),
    taxamount NUMERIC(12,2),
    duedate DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'disputed', 'rejected', 'overdue')),
    paymentterms TEXT DEFAULT 'NET30',
    notes TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE lineitems (
    id TEXT PRIMARY KEY,
    invoiceid TEXT NOT NULL REFERENCES invoices(id),
    description TEXT NOT NULL,
    quantity NUMERIC(10,2),
    unitprice NUMERIC(12,2),
    lineamount NUMERIC(12,2),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- ============================================================
-- PART 4: CONTRACTOR-SPECIFIC TABLES
-- ============================================================

CREATE TABLE biometric (
    id TEXT PRIMARY KEY,
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    biometrictype TEXT CHECK (biometrictype IN ('fingerprint', 'facial', 'voice')),
    biometricdatahash TEXT NOT NULL,
    devicemodel TEXT,
    registeredat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastused TIMESTAMP,
    status TEXT DEFAULT 'active',
    createdby TEXT REFERENCES users(id)
);

CREATE TABLE insurance (
    id TEXT PRIMARY KEY,
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    insuranceprovider TEXT NOT NULL,
    policynumber TEXT NOT NULL,
    policytype TEXT CHECK (policytype IN ('liability', 'auto', 'workers_comp', 'cargo')),
    coverageamount NUMERIC(12,2),
    effectivedate DATE NOT NULL,
    expirationdate DATE NOT NULL,
    status TEXT DEFAULT 'active',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE licenses (
    id TEXT PRIMARY KEY,
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    licensetype TEXT NOT NULL,
    licensenumber TEXT NOT NULL,
    issuingstate TEXT,
    expirationdate DATE NOT NULL,
    status TEXT DEFAULT 'active',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE backgroundchecks (
    id TEXT PRIMARY KEY,
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    checkprovider TEXT,
    checkdate DATE NOT NULL,
    result TEXT CHECK (result IN ('pass', 'fail', 'pending', 'conditional')),
    notes TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id)
);

CREATE TABLE drugtests (
    id TEXT PRIMARY KEY,
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    testtype TEXT CHECK (testtype IN ('pre_employment', 'random', 'post_accident', 'reasonable_suspicion', 'return_to_duty')),
    testdate DATE NOT NULL,
    result TEXT CHECK (result IN ('negative', 'positive', 'inconclusive', 'pending')),
    labprovider TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id)
);

CREATE TABLE contractorperformance (
    id TEXT PRIMARY KEY,
    ticketid TEXT NOT NULL UNIQUE REFERENCES tickets(id),
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    rating NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 5),
    ontime BOOLEAN,
    qualityscore NUMERIC(2,1),
    safetycompliant BOOLEAN,
    notes TEXT,
    ratedby TEXT REFERENCES users(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PART 5: SUPPORTING TABLES
-- ============================================================

CREATE TABLE address (
    id TEXT PRIMARY KEY,
    street TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    country TEXT DEFAULT 'USA',
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    entityid TEXT,
    entitytype TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE registereddevices (
    id TEXT PRIMARY KEY,
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    devicemodel TEXT,
    deviceos TEXT,
    devicetoken TEXT,
    lastactivesession TIMESTAMP,
    status TEXT DEFAULT 'active',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    ticketid TEXT NOT NULL REFERENCES tickets(id),
    photourl TEXT NOT NULL,
    phototype TEXT CHECK (phototype IN ('before', 'after', 'issue', 'signature', 'document')),
    capturedlat NUMERIC(10,6),
    capturedlong NUMERIC(10,6),
    capturedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploadedby TEXT REFERENCES users(id)
);

CREATE TABLE jobsessions (
    id TEXT PRIMARY KEY,
    ticketid TEXT NOT NULL REFERENCES tickets(id),
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    sessionstart TIMESTAMP NOT NULL,
    sessionend TIMESTAMP,
    durationminutes INTEGER,
    hodstatus TEXT,
    odometerstart NUMERIC(10,2),
    odometerend NUMERIC(10,2),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deliverysubmissions (
    id TEXT PRIMARY KEY,
    ticketid TEXT NOT NULL REFERENCES tickets(id),
    contractorid TEXT NOT NULL REFERENCES contractor(id),
    submittedat TIMESTAMP NOT NULL,
    totaldistance NUMERIC(10,2),
    fuelused NUMERIC(10,2),
    issuesfound BOOLEAN DEFAULT FALSE,
    issuesdescription TEXT,
    customersignatureurl TEXT,
    status TEXT DEFAULT 'submitted',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fraudalerts (
    id TEXT PRIMARY KEY,
    workorderid TEXT REFERENCES workorders(id),
    ticketid TEXT REFERENCES tickets(id),
    invoiceid TEXT REFERENCES invoices(id),
    alerttype TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    status TEXT DEFAULT 'open',
    flaggedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolvedat TIMESTAMP,
    resolvedby TEXT REFERENCES users(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE compliancedocuments (
    id TEXT PRIMARY KEY,
    documenttype TEXT NOT NULL,
    documenturl TEXT NOT NULL,
    entityid TEXT NOT NULL,
    entitytype TEXT,
    expirationdate DATE,
    status TEXT DEFAULT 'pending',
    uploadedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploadedby TEXT REFERENCES users(id),
    reviewedby TEXT REFERENCES users(id),
    reviewedat TIMESTAMP
);

CREATE TABLE msa (
    id TEXT PRIMARY KEY,
    clientid TEXT NOT NULL REFERENCES client(id),
    vendorid TEXT NOT NULL REFERENCES vendor(id),
    msanumber TEXT NOT NULL UNIQUE,
    effectivedate DATE NOT NULL,
    expirationdate DATE,
    documenturl TEXT,
    status TEXT DEFAULT 'draft',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL REFERENCES users(id),
    devicetoken TEXT,
    sessionstart TIMESTAMP NOT NULL,
    sessionend TIMESTAMP,
    ipaddress TEXT,
    useragent TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    isread BOOLEAN DEFAULT FALSE,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL REFERENCES users(id),
    recipient TEXT NOT NULL REFERENCES users(id),
    chatid TEXT NOT NULL,
    message TEXT NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

CREATE TABLE chat (
    chatid TEXT PRIMARY KEY,
participant1 TEXT NOT NULL REFERENCES users(id),
        participant2 TEXT NOT NULL REFERENCES users(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdby TEXT REFERENCES users(id),
    updatedby TEXT REFERENCES users(id)
);

-- ============================================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_usertype ON users(usertype);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_contractor_vendor ON contractor(vendorid);
CREATE INDEX idx_contractor_status ON contractor(status);
CREATE INDEX idx_vendor_status ON vendor(status);
CREATE INDEX idx_workorders_status ON workorders(status);
CREATE INDEX idx_workorders_client ON workorders(clientid);
CREATE INDEX idx_tickets_contractor ON tickets(contractorid);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_vendor ON tickets(vendorid);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_vendor ON invoices(vendorid);
CREATE INDEX idx_fraudalerts_severity ON fraudalerts(severity);
CREATE INDEX idx_sessions_userid ON sessions(userid);
CREATE INDEX idx_notifications_userid ON notifications(userid);
CREATE INDEX idx_jobsessions_contractor ON jobsessions(contractorid);
CREATE INDEX idx_contractorperformance_rating ON contractorperformance(rating);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
