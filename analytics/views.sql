-- ==================================================
-- TR42 Contractor Mobile App - Database Views
-- Sprint 2-3: Data Design + Mock Dashboard
-- Based on: Vendor Database ERD (dbdiagram.io)
-- Team: TR42 Contractor Team (Team B)
-- ==================================================


-- ==================================================
-- PART 1: CONTRACTOR DASHBOARD - STATS CARD VIEWS
-- ==================================================

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
WHERE t.status IN ('assigned', 'in_progress')
GROUP BY c.id, u.firstname, u.lastname;

-- 1.4 v_contractor_average_rating: Average rating from completed jobs
CREATE OR REPLACE VIEW v_contractor_average_rating AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    ROUND(AVG(r.rating), 2) AS avg_rating,
    COUNT(r.id) AS total_ratings
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
LEFT JOIN reviews r ON t.id = r.ticketid
WHERE t.status = 'completed'
GROUP BY c.id, u.firstname, u.lastname;


-- ==================================================
-- PART 2: JOB HISTORY LIST - DETAIL VIEWS
-- ==================================================

-- 2.1 v_contractor_job_history: Full job history for contractor
CREATE OR REPLACE VIEW v_contractor_job_history AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.createddate,
    t.duedate,
    c.id AS contractor_id,
    u.firstname AS contractor_firstname,
    u.lastname AS contractor_lastname,
    cu.firstname AS customer_firstname,
    cu.lastname AS customer_lastname,
    a.streetaddress,
    a.city,
    a.state,
    a.zipcode
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
JOIN customers cust ON t.customerid = cust.id
JOIN users cu ON cust.userid = cu.id
JOIN address a ON t.addressid = a.id;

-- 2.2 v_contractor_job_details_with_ratings: Job details including customer ratings
CREATE OR REPLACE VIEW v_contractor_job_details_with_ratings AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.title,
    t.status,
    t.priority,
    t.duedate,
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    r.rating,
    r.comments AS review_comments,
    r.reviewdate
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
LEFT JOIN reviews r ON t.id = r.ticketid
WHERE t.status = 'completed';


-- ==================================================
-- PART 3: PERFORMANCE CHARTS - TIME-BASED VIEWS
-- ==================================================

-- 3.1 v_contractor_jobs_by_month: Jobs completed per month
CREATE OR REPLACE VIEW v_contractor_jobs_by_month AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    DATE_TRUNC('month', t.completeddate) AS job_month,
    COUNT(*) AS jobs_completed
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status = 'completed'
GROUP BY c.id, u.firstname, u.lastname, DATE_TRUNC('month', t.completeddate)
ORDER BY job_month;

-- 3.2 v_contractor_average_completion_time: Average days to complete jobs
CREATE OR REPLACE VIEW v_contractor_average_completion_time AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    ROUND(AVG(t.completeddate - t.createddate), 1) AS avg_completion_days,
    COUNT(*) AS total_completed
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status = 'completed'
GROUP BY c.id, u.firstname, u.lastname;


-- ==================================================
-- PART 4: PROFILE VIEWS - CONTRACTOR PROFILE DATA
-- ==================================================

-- 4.1 v_contractor_profile: Complete contractor profile with skills
CREATE OR REPLACE VIEW v_contractor_profile AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    u.email,
    u.phone,
    c.businessname,
    c.license,
    c.insuranceprovider,
    c.insurancenumber,
    c.bio,
    c.profilephoto,
    ARRAY_AGG(DISTINCT s.skillname) AS skills
FROM contractor c
JOIN users u ON c.userid = u.id
LEFT JOIN contractorskills cs ON c.id = cs.contractorid
LEFT JOIN skills s ON cs.skillid = s.id
GROUP BY c.id, u.firstname, u.lastname, u.email, u.phone,
         c.businessname, c.license, c.insuranceprovider,
         c.insurancenumber, c.bio, c.profilephoto;

-- 4.2 v_contractor_availability: Contractor availability schedule
CREATE OR REPLACE VIEW v_contractor_availability AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    a.dayofweek,
    a.starttime,
    a.endtime,
    a.isavailable
FROM contractor c
JOIN users u ON c.userid = u.id
JOIN availability a ON c.id = a.contractorid
ORDER BY c.id, a.dayofweek;


-- ==================================================
-- PART 5: NOTIFICATIONS - ALERT VIEWS
-- ==================================================

-- 5.1 v_contractor_notifications: All notifications for contractor
CREATE OR REPLACE VIEW v_contractor_notifications AS
SELECT
    n.id AS notification_id,
    n.title,
    n.message,
    n.type,
    n.isread,
    n.createddate,
    c.id AS contractor_id,
    u.firstname,
    u.lastname
FROM notifications n
JOIN contractor c ON n.contractorid = c.id
JOIN users u ON c.userid = u.id
ORDER BY n.createddate DESC;

-- 5.2 v_contractor_unread_notifications: Count of unread notifications
CREATE OR REPLACE VIEW v_contractor_unread_notifications AS
SELECT
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    COUNT(*) AS unread_count
FROM notifications n
JOIN contractor c ON n.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE n.isread = FALSE
GROUP BY c.id, u.firstname, u.lastname;


-- ==================================================
-- PART 6: ACTIVE WORK - CURRENT ASSIGNMENTS
-- ==================================================

-- 6.1 v_contractor_active_work: Currently active jobs
CREATE OR REPLACE VIEW v_contractor_active_work AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.duedate,
    t.createddate,
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    a.streetaddress,
    a.city,
    a.state
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
JOIN address a ON t.addressid = a.id
WHERE t.status IN ('assigned', 'in_progress')
ORDER BY t.duedate;

-- 6.2 v_contractor_upcoming_deadlines: Jobs with approaching due dates
CREATE OR REPLACE VIEW v_contractor_upcoming_deadlines AS
SELECT
    t.id AS ticket_id,
    t.ticketnumber,
    t.title,
    t.status,
    t.duedate,
    t.duedate - CURRENT_DATE AS days_until_due,
    c.id AS contractor_id,
    u.firstname,
    u.lastname,
    CASE
        WHEN t.duedate < CURRENT_DATE THEN 'overdue'
        WHEN t.duedate - CURRENT_DATE <= 3 THEN 'urgent'
        WHEN t.duedate - CURRENT_DATE <= 7 THEN 'soon'
        ELSE 'upcoming'
    END AS urgency_level
FROM tickets t
JOIN contractor c ON t.contractorid = c.id
JOIN users u ON c.userid = u.id
WHERE t.status IN ('assigned', 'in_progress')
  AND t.duedate <= CURRENT_DATE + INTERVAL '14 days'
ORDER BY days_until_due;
