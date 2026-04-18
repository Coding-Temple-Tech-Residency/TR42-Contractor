-- ============================================================
-- TR42 Contractor Mobile App - Analytics Queries
-- Sprint 2-3: Data Design + Mock Dashboard
-- Based on: Vendor Database ERD (dbdiagram.io)
-- Team: TR42 Contractor Team (Team B)
-- ============================================================

-- ============================================================
-- PART 1: CONTRACTOR DASHBOARD - STATS CARDS
-- ============================================================

-- 1.1 Total Jobs (tickets assigned to contractor)
-- Purpose: Display total number of jobs in stats card
SELECT
    COUNT(*) AS total_jobs
FROM tickets
WHERE contractorid = :contractor_id;

-- 1.2 Completed Jobs
-- Purpose: Count of completed tickets
SELECT
    COUNT(*) AS completed_jobs
FROM tickets
WHERE contractorid = :contractor_id
    AND status = 'completed';

-- 1.3 Completion Rate
-- Purpose: Percentage of completed vs total jobs
SELECT
    ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS completion_rate
FROM tickets
WHERE contractorid = :contractor_id;

-- 1.4 Flag Rate (geofence or biometric failures)
-- Purpose: Percentage of jobs with verification issues
SELECT
    ROUND(
        COUNT(*) FILTER (WHERE geofenceverified = FALSE OR biometricverified = FALSE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS flag_rate
FROM tickets
WHERE contractorid = :contractor_id
    AND status = 'completed';

-- 1.5 Average Rating
-- Purpose: Contractor's average performance rating
SELECT
    ROUND(AVG(rating), 2) AS avg_rating
FROM contractorperformance
WHERE contractorid = :contractor_id;

-- 1.6 Total Earnings (sum of freight amounts for completed jobs)
-- Purpose: Total earnings from completed deliveries
SELECT
    COALESCE(SUM(freightamount), 0) AS total_earnings
FROM tickets
WHERE contractorid = :contractor_id
    AND status = 'completed'
    AND paymentstatus = 'paid';

-- ============================================================
-- PART 2: JOB HISTORY TABLE
-- ============================================================

-- 2.1 Job History with Pagination and Sorting
-- Purpose: Display all jobs in sortable, paginated table
SELECT
    t.id,
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
    v.vendorname,
    c.companyname AS client_name
FROM tickets t
LEFT JOIN workorders w ON t.workorderid = w.id
LEFT JOIN vendor v ON t.vendorid = v.id
LEFT JOIN client c ON w.clientid = c.id
WHERE t.contractorid = :contractor_id
ORDER BY t.createdat DESC
LIMIT :page_size OFFSET :offset;

-- 2.2 Job History Count (for pagination total pages)
SELECT COUNT(*) AS total_count
FROM tickets
WHERE contractorid = :contractor_id;

-- ============================================================
-- PART 3: PERFORMANCE CHARTS
-- ============================================================

-- 3.1 Monthly Job Trend (jobs per month)
-- Purpose: Line chart showing job volume over time
SELECT
    DATE_TRUNC('month', t.createdat) AS month,
    COUNT(*) AS job_count,
    COUNT(*) FILTER (WHERE t.status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE t.status IN ('assigned', 'accepted', 'in_transit', 'arrived')) AS active_count
FROM tickets t
WHERE t.contractorid = :contractor_id
GROUP BY DATE_TRUNC('month', t.createdat)
ORDER BY month DESC
LIMIT 12;

-- 3.2 Monthly Earnings Trend
-- Purpose: Bar chart showing earnings over time
SELECT
    DATE_TRUNC('month', t.deliverydatetime) AS month,
    COALESCE(SUM(t.freightamount), 0) AS monthly_earnings,
    COALESCE(SUM(t.fuelcost), 0) AS monthly_fuel_cost,
    COALESCE(SUM(t.freightamount - t.fuelcost), 0) AS monthly_profit
FROM tickets t
WHERE t.contractorid = :contractor_id
    AND t.status = 'completed'
    AND t.paymentstatus = 'paid'
    AND t.deliverydatetime IS NOT NULL
GROUP BY DATE_TRUNC('month', t.deliverydatetime)
ORDER BY month DESC
LIMIT 12;

-- 3.3 Rating Trend Over Time
-- Purpose: Line chart showing performance rating trends
SELECT
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
FROM contractorperformance cp
WHERE cp.contractorid = :contractor_id
GROUP BY DATE_TRUNC('month', cp.createdat)
ORDER BY month DESC
LIMIT 12;

-- 3.4 Jobs by Route Type
-- Purpose: Pie/donut chart showing distribution of job routes
SELECT
    t.route,
    COUNT(*) AS job_count,
    ROUND(
        COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER() * 100, 2
    ) AS percentage
FROM tickets t
WHERE t.contractorid = :contractor_id
GROUP BY t.route
ORDER BY job_count DESC;

-- 3.5 Jobs by Status
-- Purpose: Stacked bar showing job status distribution
SELECT
    t.status,
    COUNT(*) AS job_count
FROM tickets t
WHERE t.contractorid = :contractor_id
GROUP BY t.status
ORDER BY job_count DESC;

-- ============================================================
-- PART 4: CONTRACTOR PROFILE DATA
-- ============================================================

-- 4.1 Contractor Profile
-- Purpose: Load contractor details for profile section
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
    v.vendorname,
    v.companyemail AS vendor_email
FROM users u
JOIN contractor c ON u.id = c.userid
JOIN vendor v ON c.vendorid = v.id
WHERE c.id = :contractor_id;

-- 4.2 Contractor Certifications Status
-- Purpose: Display license, insurance, and compliance status
SELECT
    'License' AS document_type,
    l.licensenumber AS document_number,
    l.licensetype AS type,
    l.expirationdate,
    l.status,
    CASE
        WHEN l.expirationdate < CURRENT_DATE THEN 'EXPIRED'
        WHEN l.expirationdate < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS validity_status
FROM licenses l
WHERE l.contractorid = :contractor_id
UNION ALL
SELECT
    'Insurance' AS document_type,
    i.policynumber,
    i.policytype,
    i.expirationdate,
    i.status,
    CASE
        WHEN i.expirationdate < CURRENT_DATE THEN 'EXPIRED'
        WHEN i.expirationdate < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS validity_status
FROM insurance i
WHERE i.contractorid = :contractor_id
UNION ALL
SELECT
    'Background Check' AS document_type,
    b.id,
    b.result,
    b.checkdate AS expirationdate,
    b.result AS status,
    CASE
        WHEN b.result = 'pass' THEN 'VALID'
        WHEN b.result = 'fail' THEN 'FAILED'
        ELSE 'PENDING'
    END AS validity_status
FROM backgroundchecks b
WHERE b.contractorid = :contractor_id
ORDER BY document_type;

-- ============================================================
-- PART 5: NOTIFICATIONS
-- ============================================================

-- 5.1 Unread Notification Count
-- Purpose: Display unread count badge in notification center
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE userid = :user_id AND isread = FALSE;

-- 5.2 Recent Notifications
-- Purpose: Display list of recent notifications
SELECT
    id,
    title,
    message,
    type,
    isread,
    createdat
FROM notifications
WHERE userid = :user_id
ORDER BY createdat DESC
LIMIT 10;

-- ============================================================
-- PART 6: ACTIVE WORK
-- ============================================================

-- 6.1 Current Active Tickets
-- Purpose: Show jobs in progress for contractor
SELECT
    t.id,
    t.ticketnumber,
    t.description,
    t.route,
    t.pickuplocation,
    t.deliverylocation,
    t.freightamount,
    t.status,
    t.pickupdatetime,
    w.workordername
FROM tickets t
LEFT JOIN workorders w ON t.workorderid = w.id
WHERE t.contractorid = :contractor_id
    AND t.status IN ('accepted', 'in_transit', 'arrived')
ORDER BY t.pickupdatetime DESC;

-- ============================================================
-- END OF ANALYTICS QUERIES
-- ============================================================
