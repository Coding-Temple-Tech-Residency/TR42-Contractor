-- ================================================================
-- SPRINT 2 – Event Tracking Table + Sample Dataset
-- TR42-Contractor Platform
-- Run AFTER sprint1_kpi_views.sql
-- ================================================================

-- ----------------------------------------------------------------
-- EVENT TRACKING TABLE
-- Captures every user-triggered action in the platform
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_log (
  id            BIGSERIAL PRIMARY KEY,
  event_name    VARCHAR(100)  NOT NULL,  -- e.g. 'user_login', 'work_order_created'
  user_id       INTEGER       REFERENCES authuser(id) ON DELETE SET NULL,
  user_type     VARCHAR(50),             -- snapshot: 'contractor' | 'vendor' | 'client'
  entity_type   VARCHAR(50),             -- 'work_order' | 'ticket' | 'inspection' | etc.
  entity_id     INTEGER,                 -- FK to the related record
  device_type   VARCHAR(30),             -- 'mobile' | 'desktop' | 'tablet'
  session_id    VARCHAR(100),            -- client-generated session UUID
  properties    JSONB,                   -- flexible key/value bag for extra context
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes for fast KPI queries
CREATE INDEX IF NOT EXISTS idx_event_log_event_name   ON public.event_log (event_name);
CREATE INDEX IF NOT EXISTS idx_event_log_user_id      ON public.event_log (user_id);
CREATE INDEX IF NOT EXISTS idx_event_log_created_at   ON public.event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_entity       ON public.event_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_log_session      ON public.event_log (session_id);

-- ----------------------------------------------------------------
-- EVENT TRACKING PLAN (reference table — documents every event)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_tracking_plan (
  event_name    VARCHAR(100) PRIMARY KEY,
  trigger_desc  TEXT NOT NULL,
  properties    TEXT,             -- comma-separated property names
  related_kpi   TEXT,
  team_owner    VARCHAR(50),      -- 'backend' | 'frontend' | 'mobile'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Populate the event tracking plan
INSERT INTO public.event_tracking_plan (event_name, trigger_desc, properties, related_kpi, team_owner)
VALUES
  ('user_login',             'User submits login form successfully',       'user_id, user_type, device_type, session_id',                    'Authentication Success Rate',     'backend'),
  ('user_login_failed',      'Login attempt fails (wrong password/user)',  'email_attempted, failure_reason, device_type',                   'Authentication Failure Rate',     'backend'),
  ('user_logout',            'User clicks logout',                         'user_id, user_type, session_duration_sec',                       'Session Duration',                'frontend'),
  ('user_signup',            'New user account created',                   'user_id, user_type, created_by',                                 'Signup Conversion Rate',          'backend'),
  ('work_order_created',     'Work order saved for first time',            'work_order_id, client_id, vendor_id, priority, estimated_cost',  'Work Order Volume',               'backend'),
  ('work_order_assigned',    'Work order assigned to vendor',              'work_order_id, vendor_id, assigned_by',                          'Assignment Rate',                 'backend'),
  ('work_order_completed',   'Work order marked completed',                'work_order_id, duration_days, vendor_id',                        'Work Order Completion Rate',      'backend'),
  ('work_order_cancelled',   'Work order cancelled',                       'work_order_id, cancelled_by, reason',                            'Cancellation Rate',               'backend'),
  ('ticket_created',         'Ticket created under a work order',          'ticket_id, work_order_id, vendor_id, priority',                  'Ticket Volume',                   'backend'),
  ('ticket_assigned',        'Ticket assigned to a contractor',            'ticket_id, contractor_id, assigned_by',                          'Contractor Utilization Rate',     'backend'),
  ('ticket_started',         'Contractor marks ticket as started',         'ticket_id, contractor_id, start_location',                       'Field Ops Tracking',              'mobile'),
  ('ticket_completed',       'Contractor marks ticket complete',           'ticket_id, duration_hours, end_location',                        'Ticket Resolution Time',          'mobile'),
  ('anomaly_flagged',        'Anomaly flag set on ticket',                 'ticket_id, reason, flagged_by',                                  'Anomaly Rate',                    'backend'),
  ('inspection_submitted',   'Contractor submits inspection form',         'inspection_id, contractor_id, status, pass_rate',                'Inspection Pass Rate',            'mobile'),
  ('inspection_failed',      'Inspection marked failed',                   'inspection_id, contractor_id, failed_items',                     'Inspection Failure Rate',         'mobile'),
  ('ai_report_generated',    'AI inspection report created',               'report_id, inspection_id, anomaly_detected',                     'AI Insight Coverage',             'backend'),
  ('contractor_onboarded',   'Contractor completes onboarding',            'contractor_id, vendor_id, is_licensed, is_insured',              'Contractor Onboarding Rate',      'backend'),
  ('invoice_created',        'Invoice generated for work order',           'invoice_id, work_order_id, amount',                              'Revenue Tracking',                'backend'),
  ('chat_message_sent',      'User sends a chat message',                  'message_id, sender_id, receiver_id, chat_id',                   'Engagement / Communication',      'frontend'),
  ('session_started',        'App session begins (auto-fired on load)',    'user_id, device_type, session_id, platform',                     'DAU / WAU',                       'frontend')
ON CONFLICT (event_name) DO NOTHING;

-- ----------------------------------------------------------------
-- SAMPLE DATASET: Simulate realistic event logs for 30 days
-- Generates ~200 rows of plausible platform activity
-- ----------------------------------------------------------------
DO $$
DECLARE
  i INT;
  events TEXT[] := ARRAY[
    'user_login','user_login','user_login',        -- weighted higher (frequent)
    'user_logout',
    'work_order_created','work_order_assigned','work_order_completed','work_order_cancelled',
    'ticket_created','ticket_created','ticket_assigned','ticket_started','ticket_completed',
    'anomaly_flagged',
    'inspection_submitted','inspection_failed',
    'ai_report_generated',
    'contractor_onboarded',
    'invoice_created',
    'chat_message_sent','chat_message_sent',
    'session_started','session_started','session_started',
    'user_login_failed'
  ];
  user_types TEXT[] := ARRAY['contractor','contractor','contractor','vendor','vendor','client'];
  devices TEXT[]    := ARRAY['mobile','mobile','desktop','tablet'];
  chosen_event TEXT;
  chosen_type  TEXT;
  chosen_dev   TEXT;
  rand_user_id INT;
  rand_days_ago INT;
BEGIN
  FOR i IN 1..250 LOOP
    chosen_event := events[1 + floor(random() * array_length(events, 1))::int];
    chosen_type  := user_types[1 + floor(random() * array_length(user_types, 1))::int];
    chosen_dev   := devices[1 + floor(random() * array_length(devices, 1))::int];
    rand_user_id := 1 + floor(random() * 50)::int;   -- assumes up to 50 users
    rand_days_ago := floor(random() * 30)::int;

    INSERT INTO public.event_log (
      event_name, user_id, user_type, device_type,
      session_id, properties, created_at
    ) VALUES (
      chosen_event,
      rand_user_id,
      chosen_type,
      chosen_dev,
      gen_random_uuid()::text,
      jsonb_build_object(
        'simulated', true,
        'sprint', 2,
        'iteration', i
      ),
      NOW() - (rand_days_ago || ' days')::interval - (floor(random() * 1440) || ' minutes')::interval
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------
-- SPRINT 2 KPI VIEWS: Powered by event_log
-- ----------------------------------------------------------------

-- DAU from real event stream
CREATE OR REPLACE VIEW analytics.kpi_dau AS
SELECT
  DATE(created_at) AS activity_date,
  user_type,
  COUNT(DISTINCT user_id) AS daily_active_users,
  COUNT(*) AS total_events
FROM public.event_log
GROUP BY DATE(created_at), user_type
ORDER BY activity_date DESC;

-- WAU from real event stream
CREATE OR REPLACE VIEW analytics.kpi_wau AS
SELECT
  DATE_TRUNC('week', created_at)::date AS week_start,
  user_type,
  COUNT(DISTINCT user_id) AS weekly_active_users
FROM public.event_log
GROUP BY DATE_TRUNC('week', created_at), user_type
ORDER BY week_start DESC;

-- Auth success vs failure rate
CREATE OR REPLACE VIEW analytics.kpi_auth_success_rate AS
SELECT
  DATE(created_at) AS day,
  COUNT(*) FILTER (WHERE event_name = 'user_login')         AS successful_logins,
  COUNT(*) FILTER (WHERE event_name = 'user_login_failed')  AS failed_logins,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'user_login')::numeric
    / NULLIF(
        COUNT(*) FILTER (WHERE event_name IN ('user_login', 'user_login_failed')), 0
      ) * 100,
    2
  ) AS success_rate_pct
FROM public.event_log
WHERE event_name IN ('user_login', 'user_login_failed')
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Most common events (engagement overview)
CREATE OR REPLACE VIEW analytics.kpi_event_frequency AS
SELECT
  event_name,
  user_type,
  device_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen
FROM public.event_log
GROUP BY event_name, user_type, device_type
ORDER BY event_count DESC;
