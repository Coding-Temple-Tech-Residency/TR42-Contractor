# TR42-Contractor — Database Schema Reference

## Supabase Security — Row Level Security (RLS)

All application tables have **Row Level Security enabled**. Policies are defined
in [`analytics/rls_policies.sql`](./rls_policies.sql). Run that script in the
Supabase SQL Editor after applying the main schema.

### Identity bridge

Supabase Auth uses UUIDs (`auth.users.id`). This schema uses integer primary
keys. The column `auth_users.supabase_uid UUID` links the two systems. It is
populated when a user is created through the sign-up flow and is used by the
helper functions `current_app_user_id()` and `current_app_user_role()` that
every RLS policy calls.

### Access matrix (summary)

| Table | contractor | vendor | client |
|-------|-----------|--------|--------|
| auth_users | own row | own row + their contractors | own row |
| contractors | own row | their contractors | — |
| vendors | their vendor | own row | — |
| clients | — | clients on their work orders | own row |
| work_orders | via assigned tickets | own | own |
| tickets | assigned to them | own | via work orders |
| inspections | own | their contractors | — |
| inspection_results | own | their contractors | — |
| ai_inspection_reports | own | their contractors | — |
| duty_sessions / duty_logs | own | their contractors | — |
| invoices / lineitems | — | own | own |
| messages / chat | participant | participant | participant |
| notifications | own | own | own |

> **Backend service-role key** bypasses RLS entirely — use it only in the
> trusted backend process, never in client-side code.

---

Source of truth: `backend/app/models.py`. Table names are snake_case. All FKs use the format `table.id`.

## Auth & People

### auth_users
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| email | varchar(360) | unique, not null |
| username | varchar(360) | unique, not null |
| password | varchar(500) | not null |
| role | varchar(360) | not null — 'vendor' \| 'contractor' \| 'client' |
| is_active | bool | default true |
| profile_photo | varchar(500) | nullable |
| created_at | timestamptz | not null |
| updated_at | timestamptz | nullable |
| created_by | FK auth_users.id | not null |
| updated_by | FK auth_users.id | nullable |

### contractors
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK, FK auth_users.id |
| vendor_id | int | FK vendors.id, not null |
| manager_id | int | FK auth_users.id, not null |
| first_name | varchar(360) | not null |
| last_name | varchar(360) | not null |
| license_number | varchar(20) | not null |
| expiration_date | date | not null |
| contractor_type | varchar(360) | not null |
| status | varchar(20) | not null |
| tax_classification | varchar(360) | not null |
| contact_number | varchar(20) | not null |
| date_of_birth | date | not null |
| address | varchar(500) | not null |
| offline_pin | varchar(10) | nullable |

### vendors
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK, FK auth_users.id |
| first_name | varchar(360) | not null |
| last_name | varchar(360) | not null |

### clients
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK, FK auth_users.id |
| first_name | varchar(360) | not null |
| last_name | varchar(360) | not null |

## Work / Tickets

### work_orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| assigned_vendor | int | FK vendors.id, not null |
| created_at | timestamptz | not null |
| description | varchar(500) | not null |
| due_date | date | not null |
| current_status | varchar(360) | not null |
| location | varchar(500) | not null |
| estimated_cost | float | not null |
| estimated_duration | float | not null |
| priority | varchar(360) | not null |

### tickets
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| work_order_id | int | FK work_orders.id, not null |
| vendor_id | int | FK vendors.id, not null |
| description | varchar(500) | not null |
| priority | varchar(360) | not null |
| status | varchar(360) | not null |
| assigned_contractor | int | FK contractors.id, nullable |
| contractor_assigned_at | timestamptz | nullable |
| created_at | timestamptz | not null |
| start_time | timestamptz | nullable |
| end_time | timestamptz | nullable |
| start_location | varchar(500) | nullable |
| end_location | varchar(500) | nullable |
| designated_route | varchar(500) | nullable |
| estimated_quantity | float | nullable |
| unit | varchar(360) | nullable |
| special_requirements | varchar(500) | nullable |
| contractor_notes | varchar(500) | nullable |
| anomaly_flag | bool | default false |
| anomaly_reason | varchar(500) | nullable |

## Inspections

### inspection_templates
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| name | varchar(200) | not null |
| description | varchar(500) | nullable |
| is_active | bool | default true |
| created_at | timestamptz | not null |

### inspection_sections
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| template_id | int | FK inspection_templates.id, not null |
| name | varchar(200) | not null |
| display_order | int | default 0 |

### inspection_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| section_id | int | FK inspection_sections.id, not null |
| label | varchar(300) | not null |
| display_order | int | default 0 |

### inspections
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| template_id | int | FK inspection_templates.id, not null |
| contractor_id | int | FK contractors.id, not null |
| status | varchar(20) | not null |
| no_issues_found | bool | default false |
| skipped | bool | default false |
| submitted_at | timestamptz | nullable |
| created_at | timestamptz | not null |
| notes | varchar(1000) | nullable |

### inspection_results
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| inspection_id | int | FK inspections.id, not null |
| item_id | int | FK inspection_items.id, not null |
| passed | bool | default true |
| note | varchar(500) | nullable |

## Drive Time / Hours of Service

### duty_sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| contractor_id | int | FK contractors.id, not null |
| current_status | varchar(20) | not null |
| session_date | date | not null |
| started_at | timestamptz | not null |
| ended_at | timestamptz | nullable |
| is_active | bool | default true |
| created_at | timestamptz | not null |

### duty_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| session_id | int | FK duty_sessions.id, not null |
| contractor_id | int | FK contractors.id, not null |
| status | varchar(20) | not null |
| start_time | timestamptz | not null |
| end_time | timestamptz | nullable |
| duration_seconds | int | nullable |
| created_at | timestamptz | not null |

## AI Reports

### ai_inspection_reports
| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK |
| contractor_id | int | FK contractors.id, not null |
| title | varchar(300) | not null |
| priority | varchar(20) | not null |
| category | varchar(100) | not null |
| description | varchar(2000) | not null |
| recommended_actions | varchar(3000) | not null |
| raw_notes | varchar(2000) | nullable |
| created_at | timestamptz | not null |
