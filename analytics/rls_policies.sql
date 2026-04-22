-- ============================================================
-- TR42 Contractor — Supabase Row Level Security (RLS) Policies
-- ============================================================
-- Run this script in the Supabase SQL Editor AFTER the main schema
-- (schema_tables.sql) has been applied.
--
-- IMPORTANT — Linking Supabase Auth to auth_users
-- Supabase Auth uses UUIDs (auth.users.id).  This schema uses INTEGER
-- primary keys.  The column auth_users.supabase_uid (added below) stores
-- the UUID of the corresponding auth.users row so that RLS can bridge the
-- two identity systems.
--
-- Typical sign-up flow:
--   1. Create the Supabase Auth user  → obtain UUID
--   2. INSERT into auth_users with supabase_uid = <uuid>
--   3. INSERT into the role-specific table (contractors / vendors / clients)
-- ============================================================


-- ============================================================
-- STEP 1: Add supabase_uid column to auth_users (run once)
-- ============================================================
ALTER TABLE auth_users
    ADD COLUMN IF NOT EXISTS supabase_uid UUID UNIQUE
        REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_auth_users_supabase_uid
    ON auth_users(supabase_uid);


-- ============================================================
-- STEP 2: Helper functions
-- ============================================================

-- Returns the integer auth_users.id for the currently authenticated user.
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM auth_users WHERE supabase_uid = auth.uid() LIMIT 1;
$$;

-- Returns the role string ('vendor' | 'contractor' | 'client') for the
-- currently authenticated user.
CREATE OR REPLACE FUNCTION current_app_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM auth_users WHERE supabase_uid = auth.uid() LIMIT 1;
$$;

-- Returns true when the calling user is the vendor that manages the given
-- contractor (used in multi-table policies).
CREATE OR REPLACE FUNCTION is_vendor_of_contractor(p_contractor_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM contractors c
        WHERE c.id = p_contractor_id
          AND c.vendor_id = current_app_user_id()
    );
$$;


-- ============================================================
-- STEP 3: Enable RLS on every application table
-- ============================================================
ALTER TABLE auth_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_sections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_results     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_inspection_reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineitems              ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraudalerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliancedocuments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE msa                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat                   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 4: Policies
-- ============================================================
-- Convention: policy names follow the pattern
--   "<role(s)> can <action> <scope>"
-- Only authenticated users (auth.role() = 'authenticated') can access data.
-- The Supabase service-role key bypasses RLS entirely (used by the backend).
-- ============================================================


-- ------------------------------------------------------------
-- auth_users
-- ------------------------------------------------------------

-- Users see only their own profile row.
CREATE POLICY "users can select own profile"
    ON auth_users FOR SELECT
    USING (supabase_uid = auth.uid());

-- Vendors can see the profiles of contractors who belong to them.
CREATE POLICY "vendors can select their contractors profiles"
    ON auth_users FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND id IN (
            SELECT id FROM contractors
            WHERE vendor_id = current_app_user_id()
        )
    );

-- Users can update only their own profile (not role, not supabase_uid).
CREATE POLICY "users can update own profile"
    ON auth_users FOR UPDATE
    USING (supabase_uid = auth.uid())
    WITH CHECK (supabase_uid = auth.uid());


-- ------------------------------------------------------------
-- contractors
-- ------------------------------------------------------------

-- Contractors see their own record.
CREATE POLICY "contractors can select own record"
    ON contractors FOR SELECT
    USING (id = current_app_user_id());

-- Vendors see all contractors assigned to them.
CREATE POLICY "vendors can select their contractors"
    ON contractors FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

-- Vendors can insert contractors under themselves.
CREATE POLICY "vendors can insert contractors"
    ON contractors FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

-- Vendors can update contractors they manage.
CREATE POLICY "vendors can update their contractors"
    ON contractors FOR UPDATE
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

-- Contractors can update their own record (e.g. offline_pin, contact_number).
CREATE POLICY "contractors can update own record"
    ON contractors FOR UPDATE
    USING (id = current_app_user_id())
    WITH CHECK (id = current_app_user_id());


-- ------------------------------------------------------------
-- vendors
-- ------------------------------------------------------------

-- Vendors see only their own record.
CREATE POLICY "vendors can select own record"
    ON vendors FOR SELECT
    USING (id = current_app_user_id());

-- Contractors can see the vendor they belong to.
CREATE POLICY "contractors can select their vendor"
    ON vendors FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND id IN (
            SELECT vendor_id FROM contractors
            WHERE id = current_app_user_id()
        )
    );

-- Vendors can update their own record.
CREATE POLICY "vendors can update own record"
    ON vendors FOR UPDATE
    USING (id = current_app_user_id())
    WITH CHECK (id = current_app_user_id());


-- ------------------------------------------------------------
-- clients
-- ------------------------------------------------------------

-- Clients see only their own record.
CREATE POLICY "clients can select own record"
    ON clients FOR SELECT
    USING (id = current_app_user_id());

-- Vendors can see clients whose work orders they are assigned to.
CREATE POLICY "vendors can select clients for their work orders"
    ON clients FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND id IN (
            SELECT client_id FROM work_orders
            WHERE assigned_vendor = current_app_user_id()
        )
    );

-- Clients can update their own record.
CREATE POLICY "clients can update own record"
    ON clients FOR UPDATE
    USING (id = current_app_user_id())
    WITH CHECK (id = current_app_user_id());


-- ------------------------------------------------------------
-- work_orders
-- ------------------------------------------------------------

-- Vendors see work orders assigned to them.
CREATE POLICY "vendors can select their work orders"
    ON work_orders FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND assigned_vendor = current_app_user_id()
    );

-- Contractors see work orders that have tickets assigned to them.
CREATE POLICY "contractors can select work orders via their tickets"
    ON work_orders FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND id IN (
            SELECT work_order_id FROM tickets
            WHERE assigned_contractor = current_app_user_id()
        )
    );

-- Clients see work orders they own.
CREATE POLICY "clients can select their work orders"
    ON work_orders FOR SELECT
    USING (
        current_app_user_role() = 'client'
        AND client_id = current_app_user_id()
    );

-- Vendors can create work orders.
CREATE POLICY "vendors can insert work orders"
    ON work_orders FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND assigned_vendor = current_app_user_id()
    );

-- Vendors can update their own work orders.
CREATE POLICY "vendors can update their work orders"
    ON work_orders FOR UPDATE
    USING (
        current_app_user_role() = 'vendor'
        AND assigned_vendor = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND assigned_vendor = current_app_user_id()
    );


-- ------------------------------------------------------------
-- tickets
-- ------------------------------------------------------------

-- Contractors see tickets assigned to them.
CREATE POLICY "contractors can select their tickets"
    ON tickets FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND assigned_contractor = current_app_user_id()
    );

-- Vendors see all tickets under their work orders.
CREATE POLICY "vendors can select their tickets"
    ON tickets FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

-- Clients see tickets in their work orders.
CREATE POLICY "clients can select tickets in their work orders"
    ON tickets FOR SELECT
    USING (
        current_app_user_role() = 'client'
        AND work_order_id IN (
            SELECT id FROM work_orders
            WHERE client_id = current_app_user_id()
        )
    );

-- Vendors can create tickets.
CREATE POLICY "vendors can insert tickets"
    ON tickets FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

-- Vendors can update all fields on their tickets.
CREATE POLICY "vendors can update their tickets"
    ON tickets FOR UPDATE
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

-- Contractors can update only allowed fields (status, notes) on assigned tickets.
-- Full-column restriction is enforced at the application layer; this policy
-- restricts which rows a contractor may touch.
CREATE POLICY "contractors can update their assigned tickets"
    ON tickets FOR UPDATE
    USING (
        current_app_user_role() = 'contractor'
        AND assigned_contractor = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND assigned_contractor = current_app_user_id()
    );


-- ------------------------------------------------------------
-- inspection_templates / inspection_sections / inspection_items
-- (read-only reference data for authenticated users)
-- ------------------------------------------------------------

CREATE POLICY "authenticated users can select inspection templates"
    ON inspection_templates FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "vendors can manage inspection templates"
    ON inspection_templates FOR ALL
    USING (current_app_user_role() = 'vendor')
    WITH CHECK (current_app_user_role() = 'vendor');

CREATE POLICY "authenticated users can select inspection sections"
    ON inspection_sections FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "vendors can manage inspection sections"
    ON inspection_sections FOR ALL
    USING (current_app_user_role() = 'vendor')
    WITH CHECK (current_app_user_role() = 'vendor');

CREATE POLICY "authenticated users can select inspection items"
    ON inspection_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "vendors can manage inspection items"
    ON inspection_items FOR ALL
    USING (current_app_user_role() = 'vendor')
    WITH CHECK (current_app_user_role() = 'vendor');


-- ------------------------------------------------------------
-- inspections
-- ------------------------------------------------------------

-- Contractors see their own inspections.
CREATE POLICY "contractors can select own inspections"
    ON inspections FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

-- Vendors see inspections for all their contractors.
CREATE POLICY "vendors can select inspections for their contractors"
    ON inspections FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND is_vendor_of_contractor(contractor_id)
    );

-- Contractors can create inspections for themselves.
CREATE POLICY "contractors can insert own inspections"
    ON inspections FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

-- Contractors can update their own inspections.
CREATE POLICY "contractors can update own inspections"
    ON inspections FOR UPDATE
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- inspection_results
-- ------------------------------------------------------------

-- Contractors see results for their own inspections.
CREATE POLICY "contractors can select own inspection results"
    ON inspection_results FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND inspection_id IN (
            SELECT id FROM inspections
            WHERE contractor_id = current_app_user_id()
        )
    );

-- Vendors see results for inspections by their contractors.
CREATE POLICY "vendors can select inspection results for their contractors"
    ON inspection_results FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND inspection_id IN (
            SELECT id FROM inspections
            WHERE is_vendor_of_contractor(contractor_id)
        )
    );

-- Contractors can insert results for their own inspections.
CREATE POLICY "contractors can insert own inspection results"
    ON inspection_results FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND inspection_id IN (
            SELECT id FROM inspections
            WHERE contractor_id = current_app_user_id()
        )
    );

-- Contractors can update results for their own inspections.
CREATE POLICY "contractors can update own inspection results"
    ON inspection_results FOR UPDATE
    USING (
        current_app_user_role() = 'contractor'
        AND inspection_id IN (
            SELECT id FROM inspections
            WHERE contractor_id = current_app_user_id()
        )
    )
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND inspection_id IN (
            SELECT id FROM inspections
            WHERE contractor_id = current_app_user_id()
        )
    );


-- ------------------------------------------------------------
-- ai_inspection_reports
-- ------------------------------------------------------------

CREATE POLICY "contractors can select own ai reports"
    ON ai_inspection_reports FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

CREATE POLICY "vendors can select ai reports for their contractors"
    ON ai_inspection_reports FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND is_vendor_of_contractor(contractor_id)
    );

CREATE POLICY "contractors can insert own ai reports"
    ON ai_inspection_reports FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

CREATE POLICY "contractors can update own ai reports"
    ON ai_inspection_reports FOR UPDATE
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- duty_sessions
-- ------------------------------------------------------------

CREATE POLICY "contractors can select own duty sessions"
    ON duty_sessions FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

CREATE POLICY "vendors can select duty sessions for their contractors"
    ON duty_sessions FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND is_vendor_of_contractor(contractor_id)
    );

CREATE POLICY "contractors can insert own duty sessions"
    ON duty_sessions FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

CREATE POLICY "contractors can update own duty sessions"
    ON duty_sessions FOR UPDATE
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- duty_logs
-- ------------------------------------------------------------

CREATE POLICY "contractors can select own duty logs"
    ON duty_logs FOR SELECT
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

CREATE POLICY "vendors can select duty logs for their contractors"
    ON duty_logs FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND is_vendor_of_contractor(contractor_id)
    );

CREATE POLICY "contractors can insert own duty logs"
    ON duty_logs FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );

CREATE POLICY "contractors can update own duty logs"
    ON duty_logs FOR UPDATE
    USING (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'contractor'
        AND contractor_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- invoices
-- ------------------------------------------------------------

CREATE POLICY "vendors can select their invoices"
    ON invoices FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

CREATE POLICY "clients can select invoices for their work orders"
    ON invoices FOR SELECT
    USING (
        current_app_user_role() = 'client'
        AND client_id = current_app_user_id()
    );

CREATE POLICY "vendors can insert invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

CREATE POLICY "vendors can update their invoices"
    ON invoices FOR UPDATE
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- lineitems
-- ------------------------------------------------------------

-- Line items inherit visibility from their parent invoice.
CREATE POLICY "vendors can select their lineitems"
    ON lineitems FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND invoice_id IN (
            SELECT id FROM invoices
            WHERE vendor_id = current_app_user_id()
        )
    );

CREATE POLICY "clients can select lineitems for their invoices"
    ON lineitems FOR SELECT
    USING (
        current_app_user_role() = 'client'
        AND invoice_id IN (
            SELECT id FROM invoices
            WHERE client_id = current_app_user_id()
        )
    );

CREATE POLICY "vendors can insert lineitems"
    ON lineitems FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND invoice_id IN (
            SELECT id FROM invoices
            WHERE vendor_id = current_app_user_id()
        )
    );

CREATE POLICY "vendors can update their lineitems"
    ON lineitems FOR UPDATE
    USING (
        current_app_user_role() = 'vendor'
        AND invoice_id IN (
            SELECT id FROM invoices
            WHERE vendor_id = current_app_user_id()
        )
    )
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND invoice_id IN (
            SELECT id FROM invoices
            WHERE vendor_id = current_app_user_id()
        )
    );


-- ------------------------------------------------------------
-- fraudalerts
-- ------------------------------------------------------------

CREATE POLICY "vendors can select their fraud alerts"
    ON fraudalerts FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND (
            work_order_id IN (
                SELECT id FROM work_orders WHERE assigned_vendor = current_app_user_id()
            )
            OR ticket_id IN (
                SELECT id FROM tickets WHERE vendor_id = current_app_user_id()
            )
            OR invoice_id IN (
                SELECT id FROM invoices WHERE vendor_id = current_app_user_id()
            )
        )
    );

CREATE POLICY "clients can select fraud alerts on their work orders"
    ON fraudalerts FOR SELECT
    USING (
        current_app_user_role() = 'client'
        AND work_order_id IN (
            SELECT id FROM work_orders WHERE client_id = current_app_user_id()
        )
    );


-- ------------------------------------------------------------
-- compliancedocuments
-- ------------------------------------------------------------

-- Uploaders can see documents they uploaded.
CREATE POLICY "uploaders can select own compliance documents"
    ON compliancedocuments FOR SELECT
    USING (uploaded_by = current_app_user_id());

-- Vendors can see compliance documents for their contractors.
CREATE POLICY "vendors can select compliance docs for their contractors"
    ON compliancedocuments FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND entity_type = 'contractor'
        AND entity_id IN (
            SELECT id FROM contractors WHERE vendor_id = current_app_user_id()
        )
    );

-- Authenticated users can upload compliance documents.
CREATE POLICY "authenticated users can insert compliance documents"
    ON compliancedocuments FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND uploaded_by = current_app_user_id()
    );


-- ------------------------------------------------------------
-- msa
-- ------------------------------------------------------------

CREATE POLICY "clients can select their msas"
    ON msa FOR SELECT
    USING (
        current_app_user_role() = 'client'
        AND client_id = current_app_user_id()
    );

CREATE POLICY "vendors can select their msas"
    ON msa FOR SELECT
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

CREATE POLICY "vendors can insert msas"
    ON msa FOR INSERT
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );

CREATE POLICY "vendors can update their msas"
    ON msa FOR UPDATE
    USING (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    )
    WITH CHECK (
        current_app_user_role() = 'vendor'
        AND vendor_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- sessions (login sessions — not duty sessions)
-- ------------------------------------------------------------

CREATE POLICY "users can select own sessions"
    ON sessions FOR SELECT
    USING (user_id = current_app_user_id());

CREATE POLICY "users can insert own sessions"
    ON sessions FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND user_id = current_app_user_id()
    );


-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------

CREATE POLICY "users can select own notifications"
    ON notifications FOR SELECT
    USING (user_id = current_app_user_id());

CREATE POLICY "users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = current_app_user_id())
    WITH CHECK (user_id = current_app_user_id());


-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------

-- Users can see messages in chats they participate in.
CREATE POLICY "participants can select their messages"
    ON messages FOR SELECT
    USING (
        sender = current_app_user_id()
        OR recipient = current_app_user_id()
    );

-- Users can insert messages where they are the sender.
CREATE POLICY "users can insert own messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND sender = current_app_user_id()
    );


-- ------------------------------------------------------------
-- chat
-- ------------------------------------------------------------

-- Users can see chats they are a participant in.
CREATE POLICY "participants can select their chats"
    ON chat FOR SELECT
    USING (
        participant1 = current_app_user_id()
        OR participant2 = current_app_user_id()
    );

-- Authenticated users can create chats.
CREATE POLICY "authenticated users can insert chats"
    ON chat FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            participant1 = current_app_user_id()
            OR participant2 = current_app_user_id()
        )
    );


-- ============================================================
-- END OF RLS POLICIES
-- ============================================================
