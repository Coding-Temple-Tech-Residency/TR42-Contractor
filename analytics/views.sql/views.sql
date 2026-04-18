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

-- 1.2 v_contractor_completed_jobs: Count of completed tickets per contractor
CREATE OR REPLACE VIEW v_contractor_completed_jobs AS
SELECT
    c.id AS contractor_id,
    COUNT(*) AS completed_jobs
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
WHERE t.status = 'completed'
GROUP BY c.id;

-- 1.3 v_contractor_completion_rate: Completion rate percentage
CREATE OR REPLACE VIEW v_contractor_completion_rate AS
SELECT
    c.id AS contractor_id,
    ROUND(
        COUNT(*) FILTER (WHERE t.status = 'completed')::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS completion_rate
FROM contractor c
JOIN tickets t ON c.id = t.contractorid
GROUP BY c.id;

-- 1.4 v_contractor_flag_rate: Verification failure rate
CREATE OR REPLACE VIEW v_contractor_flag_rate AS
SELECT
    c.id AS contractor_id,
    ROUND(
        COUNT(*) FILTER (WHERE t.geofenceverified = FALSE OR t.biometricverified = FALSE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS flag_rate
FROM contractor c
JOIN tickets t ON c.id = t.contractorid
WHERE t.status = 'completed'
GROUP BY c.id;

-- 1.5 v_contractor_avg_rating: Average performance rating
CREATE OR REPLACE VIEW v_contractor_avg_rating AS
SELECT
    c.id AS contractor_id,
    ROUND(AVG(cp.rating), 2) AS avg_rating,
    COUNT(cp.id) AS total_ratings
FROM contractor c
LEFT JOIN contractorperformance cp ON c.id = cp.contractorid
GROUP BY c.id;

-- 1.6 v_contractor_total_earnings: Total earnings from completed paid jobs
CREATE OR REPLACE VIEW v_contractor_total_earnings AS
SELECT
    c.id AS contractor_id,
    COALESCE(SUM(t.freightamount), 0) AS total_earnings,
    COUNT(*) AS paid_jobs
FROM contractor c
LEFT JOIN tickets t ON c.id = t.contractorid
    AND t.status = 'completed'
    AND t.paymentstatus = 'paid'
GROUP BY c.id;

-- ============================================================
-- PART 2: JOB HISTORY VIEWS
-- ============================================================

-- 2.1 v_contractor_job_history: Full job history with details
CREATE OR REPLACE VIEW v_contractor_job_history AS
SELECT
    t.id,
    t.contractorid,
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
    w.status AS workorder_status,
    v.companyname AS vendor_name,
    cl.companyname AS client_name
FROM tickets t
LEFT JOIN workorders w ON t.workorderid = w.id
LEFT JOIN vendor v ON t.vendorid = v.id
LEFT JOIN client cl ON w.clientid = cl.id;

-- ============================================================
-- PART 3: PERFORMANCE CHART VIEWS
-- ============================================================

-- 3.1 v_contractor_monthly_jobs: Monthly job trend
CREATE OR REPLACE VIEW v_contractor_monthly_jobs AS
SELECT
    c.id AS contractor_id,
    DATE_TRUNC('month', t.createdat) AS month,
    COUNT(*) AS job_count,
    COUNT(*) FILTER (WHERE t.status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE t.status IN ('assigned', 'accepted', 'in_transit', 'arrived')) AS active_count
FROM contractor c
JOIN tickets t ON c.id = t.contractorid
GROUP BY c.id, DATE_TRUNC('month', t.createdat);

-- 3.2 v_contractor_monthly_earnings: Monthly earnings trend
CREATE OR REPLACE VIEW v_contractor_monthly_earnings AS
SELECT
    c.id AS contractor_id,
    DATE_TRUNC('month', t.deliverydatetime) AS month,
    COALESCE(SUM(t.freightamount), 0) AS monthly_earnings,
    COALESCE(SUM(t.fuelcost), 0) AS monthly_fuel_cost,
    COALESCE(SUM(t.freightamount - t.fuelcost), 0) AS monthly_profit
FROM contractor c
JOIN tickets t ON c.id = t.contractorid
WHERE t.status = 'completed'
    AND t.paymentstatus = 'paid'
    AND t.deliverydatetime IS NOT NULL
GROUP BY c.id, DATE_TRUNC('month', t.deliverydatetime);

-- 3.3 v_contractor_rating_trend: Rating trend over time
CREATE OR REPLACE VIEW v_contractor_rating_trend AS
SELECT
    c.id AS contractor_id,
    DATE_TRUNC('month', cp.createdat) AS month,
    ROUND(AVG(cp.rating), 2) AS avg_rating,
    ROUND(AVG(cp.qualityscore), 2) AS avg_quality_score,
    ROUND(
        COUNT(*) FILTER (WHERE cp.ontime = TRUE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 2
    ) AS ontime_percentage,
    ROUND(
        COUNT(*) FILTER (WHERE cp.safetycompliant = TRUE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 2
    ) AS safety_compliance_percentage
FROM contractor c
JOIN contractorperformance cp ON c.id = cp.contractorid
GROUP BY c.id, DATE_TRUNC('month', cp.createdat);

-- 3.4 v_contractor_jobs_by_route: Job distribution by route type
CREATE OR REPLACE VIEW v_contractor_jobs_by_route AS
SELECT
    c.id AS contractor_id,
    t.route,
    COUNT(*) AS job_count,
    ROUND(
        COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER (PARTITION BY c.id) * 100, 2
    ) AS percentage
FROM contractor c
JOIN tickets t ON c.id = t.contractorid
GROUP BY c.id, t.route;

-- 3.5 v_contractor_jobs_by_status: Job distribution by status
CREATE OR REPLACE VIEW v_contractor_jobs_by_status AS
SELECT
    c.id AS contractor_id,
    t.status,
    COUNT(*) AS job_count
FROM contractor c
JOIN tickets t ON c.id = t.contractorid
GROUP BY c.id, t.status;

-- ============================================================
-- PART 4: CONTRACTOR PROFILE VIEWS
-- ============================================================

-- 4.1 v_contractor_profile: Contractor details for profile section
CREATE OR REPLACE VIEW v_contractor_profile AS
SELECT
    u.id AS user_id,
    u.firstname,
    u.lastname,
    u.email,
    u.phone,
    u.status AS user_status,
    c.id AS contractor_id,
    c.employeetype,
    c.cdl_number,
    c.cdl_expiry,
    c.dot_number,
    c.status AS contractor_status,
    c.createdat AS contractor_created_at,
    v.companyname AS vendor_name,
    v.companyemail AS vendor_email,
    v.companyphone AS vendor_phone
FROM users u
JOIN contractor c ON u.id = c.userid
JOIN vendor v ON c.vendorid = v.id;

-- 4.2 v_contractor_certifications: Unified license/insurance/background check statuses
CREATE OR REPLACE VIEW v_contractor_certifications AS
SELECT
    c.id AS contractor_id,
    'License' AS document_type,
    l.licensenumber AS document_number,
    l.licensetype AS type,
    l.issuingstate,
    l.expirationdate,
    l.status,
    CASE
        WHEN l.expirationdate < CURRENT_DATE THEN 'EXPIRED'
        WHEN l.expirationdate < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS validity_status
FROM contractor c
LEFT JOIN licenses l ON c.id = l.contractorid
UNION ALL
SELECT
    c.id AS contractor_id,
    'Insurance' AS document_type,
    i.policynumber,
    i.policytype,
    NULL AS issuingstate,
    i.expirationdate,
    i.status,
    CASE
        WHEN i.expirationdate < CURRENT_DATE THEN 'EXPIRED'
        WHEN i.expirationdate < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS validity_status
FROM contractor c
LEFT JOIN insurance i ON c.id = i.contractorid
UNION ALL
SELECT
    c.id AS contractor_id,
    'Background Check' AS document_type,
    b.id,
    b.result AS type,
    b.checkprovider AS issuingstate,
    b.checkdate AS expirationdate,
    b.result AS status,
    CASE
        WHEN b.result = 'pass' THEN 'VALID'
        WHEN b.result = 'fail' THEN 'FAILED'
        ELSE 'PENDING'
    END AS validity_status
FROM contractor c
LEFT JOIN backgroundchecks b ON c.id = b.contractorid
ORDER BY contractor_id, document_type;

-- ============================================================
-- PART 5: NOTIFICATION VIEWS
-- ============================================================

-- 5.1 v_unread_notification_count: Unread badge count per user
CREATE OR REPLACE VIEW v_unread_notification_count AS
SELECT
    userid,
    COUNT(*) AS unread_count
FROM notifications
WHERE isread = FALSE
GROUP BY userid;

-- 5.2 v_recent_notifications: Latest notifications per user
CREATE OR REPLACE VIEW v_recent_notifications AS
SELECT
    n.id,
    n.userid,
    u.firstname,
    u.lastname,
    n.title,
    n.message,
    n.type,
    n.isread,
    n.createdat
FROM notifications n
JOIN users u ON n.userid = u.id
ORDER BY n.createdat DESC;

-- ============================================================
-- PART 6: ACTIVE WORK VIEWS
-- ============================================================

-- 6.1 v_contractor_active_tickets: Current active jobs for contractor
CREATE OR REPLACE VIEW v_contractor_active_tickets AS
SELECT
    t.id,
    t.contractorid,
    t.ticketnumber,
    t.description,
    t.route,
    t.pickuplocation,
    t.deliverylocation,
    t.freightamount,
    t.fuelcost,
    t.status,
    t.pickupdatetime,
    t.deliverydatetime,
    w.workordername,
    w.clientid,
    cl.companyname AS client_name,
    v.companyname AS vendor_name
FROM tickets t
LEFT JOIN workorders w ON t.workorderid = w.id
LEFT JOIN client cl ON w.clientid = cl.id
LEFT JOIN vendor v ON t.vendorid = v.id
WHERE t.status IN ('accepted', 'in_transit', 'arrived');

-- ============================================================
-- END OF VIEWS
-- ============================================================
