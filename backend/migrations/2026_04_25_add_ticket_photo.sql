-- ─────────────────────────────────────────────────────────────────────────
-- Migration: add ticket_photo table
-- Date:      2026-04-25
-- Branch:    feature/ticket-photos
-- Apply via: Supabase dashboard → SQL editor → paste & run.
--
-- This is idempotent — safe to re-run. Each statement uses IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_photo (
    id              SERIAL PRIMARY KEY,
    ticket_id       INTEGER       NOT NULL REFERENCES ticket(id),
    uploaded_by     INTEGER       NOT NULL REFERENCES contractor(id),

    -- Client-supplied UUIDv4. UNIQUE so a duplicate from offline-sync retry
    -- returns the existing row (idempotency) instead of creating a copy.
    submission_uuid VARCHAR(36)   NOT NULL UNIQUE,

    -- Opaque key into the configured Storage backend. Never exposed to clients.
    storage_key     VARCHAR(500)  NOT NULL,

    -- sha256 of the SANITISED bytes (post EXIF strip / re-encode). Audit + dedupe.
    content_hash    VARCHAR(64)   NOT NULL,
    mime_type       VARCHAR(50)   NOT NULL,
    byte_size       INTEGER       NOT NULL,

    -- GPS extracted from EXIF BEFORE the strip. Nullable because many photos
    -- have no GPS metadata. Compare to work_order.latitude/longitude later
    -- for AI anomaly scoring (PRD 3 Feature 3).
    exif_lat        DOUBLE PRECISION,
    exif_lng        DOUBLE PRECISION,

    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Hot-path indexes:
--   ticket_id     — list-by-ticket queries
--   uploaded_by   — per-contractor activity dashboards
--   content_hash  — future dedupe scans
CREATE INDEX IF NOT EXISTS ix_ticket_photo_ticket_id    ON ticket_photo(ticket_id);
CREATE INDEX IF NOT EXISTS ix_ticket_photo_uploaded_by  ON ticket_photo(uploaded_by);
CREATE INDEX IF NOT EXISTS ix_ticket_photo_content_hash ON ticket_photo(content_hash);

-- Sanity check after running:
--   SELECT * FROM information_schema.columns WHERE table_name = 'ticket_photo';
