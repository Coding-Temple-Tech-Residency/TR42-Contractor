-- ============================================================
-- TR42 Contractor Mobile App - Database Views
-- Sprint 2-3: Data Design + Mock Dashboard
-- Based on: Vendor Database ERD (dbdiagram.io)
-- Team: TR42 Contractor Team (Team B)
-- ============================================================

-- ============================================================
-- PART 1: CONTRACTOR DASHBOARD - STATS CARD VIEWS
-- ============================================================

-- 1.1 v_contractor_total_jobs: Total jobs assigned to contractor
CREATE OR REPLACE VIEW v_contractor_total_jobs AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    COUNT(*) AS total_jobs
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
GROUP BY c.id, u.firstname, u.lastname;

-- 1.2 v_contractor_completed_jobs: Count of completed jobs
CREATE OR REPLACE VIEW v_contractor_completed_jobs AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    COUNT(*) AS completed_jobs
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status = 'completed'
GROUP BY c.id, u.firstname, u.lastname;

-- 1.3 v_contractor_pending_jobs: Count of pending/in-progress jobs
CREATE OR REPLACE VIEW v_contractor_pending_jobs AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    COUNT(*) AS pending_jobs
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status IN ('assigned', 'accepted', 'in_transit', 'arrived')
GROUP BY c.id, u.firstname, u.lastname;

-- 1.4 v_contractor_average_rating: Average rating from completed jobs
CREATE OR REPLACE VIEW v_contractor_average_rating AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    ROUND(AVG(cp.rating), 2) AS avg_rating,
    COUNT(cp.id) AS total_ratings
FROM contractor c
JOIN users u ON c.userid = u.id
LEFT JOIN contractorperformance cp ON c.id = cp.contractorid
GROUP BY c.id, u.firstname, u.lastname;

-- ============================================================
-- PART 2: JOB HISTORY LIST - DETAIL VIEWS
-- ============================================================

-- 2.1 v_contractor_job_history: Full job history for contractor
CREATE OR REPLACE VIEW v_contractor_job_history AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.description,
    t.route,
    t.pickuplocation,
    t.deliverylocation,
    t.servicetype,
    t.freightamount,
    t.fuelcost,
    t.status,
    t.paymentstatus,
    t.pickupdatetime,
    t.deliverydatetime,
    t.geofenceverified,
    t.biometricverified,
    t.createdat,
    w.workordername,
    v.companyname AS vendor_name,
    cli.companyname AS client_name
FROM tickets t
LEFT JOIN workorders w ON t.workorderid = w.id
LEFT JOIN vendor v ON t.vendorid = v.id
LEFT JOIN client cli ON w.clientid = cli.id
WHERE t.contractorid IS NOT NULL;

-- 2.2 v_contractor_job_details_with_ratings: Job details including contractor ratings
CREATE OR REPLACE VIEW v_contractor_job_details_with_ratings AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.description,
    t.route,
    t.status,
    t.paymentstatus,
    t.pickupdatetime,
    t.deliverydatetime,
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    cp.rating,
    cp.ontime,
    cp.qualityscore,
    cp.safetycompliant,
    cp.notes AS performance_notes
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
LEFT JOIN contractorperformance cp ON t.id = cp.ticketid
WHERE t.status = 'completed';

-- ============================================================
-- PART 3: PERFORMANCE CHARTS - TIME-BASED VIEWS
-- ============================================================

-- 3.1 v_contractor_jobs_by_month: Jobs completed per month
CREATE OR REPLACE VIEW v_contractor_jobs_by_month AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    DATE_TRUNC('month', t.deliverydatetime) AS job_month,
    COUNT(*) AS jobs_completed
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status = 'completed' AND t.deliverydatetime IS NOT NULL
GROUP BY c.id, u.firstname, u.lastname, DATE_TRUNC('month', t.deliverydatetime)
ORDER BY job_month;

-- 3.2 v_contractor_average_completion_time: Average days to complete jobs
CREATE OR REPLACE VIEW v_contractor_average_completion_time AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (t.deliverydatetime - t.pickupdatetime)) / 3600
    ), 1) AS avg_completion_hours,
    COUNT(*) AS total_completed
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status = 'completed'
  AND t.deliverydatetime IS NOT NULL
  AND t.pickupdatetime IS NOT NULL
GROUP BY c.id, u.firstname, u.lastname;

-- ============================================================
-- PART 4: PROFILE VIEWS - CONTRACTOR PROFILE DATA
-- ============================================================

-- 4.1 v_contractor_profile: Complete contractor profile with compliance data
CREATE OR REPLACE VIEW v_contractor_profile AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    u.email,
    u.phone,
    u.status AS user_status,
    c.employeetype,
    c.cdl_number,
    c.cdl_expiry,
    c.dot_number,
    c.status AS contractor_status,
    v.companyname AS vendor_name,
    v.companyemail AS vendor_email,
    (SELECT STRING_AGG(DISTINCT l.licensetype, ', ')
     FROM licenses l WHERE l.contractorid = c.id) AS licenses,
    (SELECT STRING_AGG(DISTINCT i.policytype, ', ')
     FROM insurance i WHERE i.contractorid = c.id) AS insurance_types
FROM contractor c
JOIN users u ON c.userid = u.id
JOIN vendor v ON c.vendorid = v.id;

-- 4.2 v_contractor_compliance_status: License and insurance status
CREATE OR REPLACE VIEW v_contractor_compliance_status AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    l.licensetype AS document_type,
    l.licensenumber AS document_number,
    l.expirationdate,
    l.status,
    CASE
        WHEN l.expirationdate < CURRENT_DATE THEN 'EXPIRED'
        WHEN l.expirationdate < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS validity_status
FROM contractor c
JOIN users u ON c.userid = u.id
LEFT JOIN licenses l ON c.id = l.contractorid
UNION ALL
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    i.policytype AS document_type,
    i.policynumber AS document_number,
    i.expirationdate,
    i.status,
    CASE
        WHEN i.expirationdate < CURRENT_DATE THEN 'EXPIRED'
        WHEN i.expirationdate < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS validity_status
FROM contractor c
JOIN users u ON c.userid = u.id
LEFT JOIN insurance i ON c.id = i.contractorid
ORDER BY contractor_id, document_type;

-- ============================================================
-- PART 5: NOTIFICATIONS - ALERT VIEWS
-- ============================================================

-- 5.1 v_contractor_notifications: All notifications for contractor
CREATE OR REPLACE VIEW v_contractor_notifications AS
SELECT
    n.id AS notification_id,
    n.title,
    n.message,
    n.type,
    n.isread,
    n.createdat,
    u.id AS user_id,
    c.id AS contractor_id,
    u.firstname,
    u.lastname
FROM notifications n
JOIN users u ON n.userid = u.id
JOIN contractor c ON u.id = c.userid
ORDER BY n.createdat DESC;

-- 5.2 v_contractor_unread_notifications: Count of unread notifications
CREATE OR REPLACE VIEW v_contractor_unread_notifications AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    COUNT(*) AS unread_count
FROM notifications n
JOIN users u ON n.userid = u.id
JOIN contractor c ON u.id = c.userid
WHERE n.isread = FALSE
GROUP BY c.id, u.firstname, u.lastname;

-- ============================================================
-- PART 6: ACTIVE WORK - CURRENT ASSIGNMENTS
-- ============================================================

-- 6.1 v_contractor_active_work: Currently active jobs
CREATE OR REPLACE VIEW v_contractor_active_work AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.description,
    t.route,
    t.pickuplocation,
    t.deliverylocation,
    t.freightamount,
    t.fuelcost,
    t.status,
    t.paymentstatus,
    t.pickupdatetime,
    t.deliverydatetime,
    t.geofenceverified,
    t.biometricverified,
    t.createdat,
    w.workordername,
    c.id AS contractor_id,
    u.firstname,
    u.lastname
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
LEFT JOIN workorders w ON t.workorderid = w.id
WHERE t.status IN ('assigned', 'accepted', 'in_transit', 'arrived')
ORDER BY t.pickupdatetime DESC;

-- 6.2 v_contractor_upcoming_deadlines: Jobs with approaching due dates
CREATE OR REPLACE VIEW v_contractor_upcoming_deadlines AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.description,
    t.status,
    t.pickupdatetime,
    t.deliverydatetime,
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    w.workordername,
    CASE
        WHEN t.status = 'assigned' THEN 'not_started'
        WHEN t.status IN ('accepted', 'in_transit') THEN 'in_progress'
        WHEN t.status = 'arrived' THEN 'at_location'
        ELSE 'unknown'
    END AS urgency_level
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
LEFT JOIN workorders w ON t.workorderid = w.id
WHERE t.status IN ('assigned', 'accepted', 'in_transit', 'arrived')
ORDER BY t.pickupdatetime DESC;

-- ============================================================
-- END OF VIEWS
-- ============================================================
