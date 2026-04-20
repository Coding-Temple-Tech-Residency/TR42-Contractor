# TR42-Contractor — Database Schema Reference

Source of truth: `backend/app/models.py`. Table names are snake_case. All FKs use the format `table.id`.

## Auth & People

```
auth_users
  id                PK int
  email             varchar(360)   unique, not null
  username          varchar(360)   unique, not null
  password          varchar(500)   not null
  role              varchar(360)   not null   -- 'vendor' | 'contractor' | 'client'
  is_active         bool           default true
  profile_photo     varchar(500)   nullable
  created_at        timestamptz    not null
  updated_at        timestamptz    nullable
  created_by        FK auth_users.id not null
  updated_by        FK auth_users.id nullable

contractors
  id                PK, FK auth_users.id
  vendor_id         FK vendors.id    not null
  manager_id        FK auth_users.id not null
  first_name        varchar(360)   not null
  last_name         varchar(360)   not null
  license_number    varchar(20)    not null
  expiration_date   date           not null
  contractor_type   varchar(360)   not null
  status            varchar(20)    not null
  tax_classification varchar(360)  not null
  contact_number    varchar(20)    not null
  date_of_birth     date           not null
  address           varchar(500)   not null
  offline_pin       varchar(10)    nullable

vendors
  id                PK, FK auth_users.id
  first_name        varchar(360)   not null
  last_name         varchar(360)   not null

clients
  id                PK, FK auth_users.id
  first_name        varchar(360)   not null
  last_name         varchar(360)   not null
```

## Work / Tickets

```
work_orders
  id                PK int
  assigned_vendor   FK vendors.id  not null
  created_at        timestamptz    not null
  description       varchar(500)   not null
  due_date          date           not null
  current_status    varchar(360)   not null
  location          varchar(500)   not null     -- "lat,lng" string
  estimated_cost    float          not null
  estimated_duration float         not null
  priority          varchar(360)   not null

tickets
  id                      PK int
  work_order_id           FK work_orders.id  not null
  vendor_id               FK vendors.id      not null
  description             varchar(500)       not null
  priority                varchar(360)       not null
  status                  varchar(360)       not null  -- to_do | in_progress | completed
  assigned_contractor     FK contractors.id
  contractor_assigned_at  timestamptz
  created_at              timestamptz        not null
  start_time              timestamptz        nullable
  end_time                timestamptz        nullable
  start_location          varchar(500)       nullable
  end_location            varchar(500)       nullable
  designated_route        varchar(500)       nullable
  estimated_quantity      float
  unit                    varchar(360)
  special_requirements    varchar(500)
  contractor_notes        varchar(500)       nullable
  anomaly_flag            bool               default false
  anomaly_reason          varchar(500)       nullable
```

## Inspections

```
inspection_templates
  id                PK int
  name              varchar(200)   not null
  description       varchar(500)   nullable
  is_active         bool           default true
  created_at        timestamptz    not null

inspection_sections
  id                PK int
  template_id       FK inspection_templates.id  not null
  name              varchar(200)   not null
  display_order     int            default 0

inspection_items
  id                PK int
  section_id        FK inspection_sections.id   not null
  label             varchar(300)   not null
  display_order     int            default 0

inspections
  id                PK int
  template_id       FK inspection_templates.id  not null
  contractor_id     FK contractors.id           not null
  status            varchar(20)    not null    -- pending | passed | failed | skipped
  no_issues_found   bool           default false
  skipped           bool           default false
  submitted_at      timestamptz    nullable
  created_at        timestamptz    not null
  notes             varchar(1000)  nullable

inspection_results
  id                PK int
  inspection_id     FK inspections.id          not null
  item_id           FK inspection_items.id     not null
  passed            bool           default true
  note              varchar(500)   nullable
```

## Drive Time / Hours of Service

```
duty_sessions
  id                PK int
  contractor_id     FK contractors.id   not null
  current_status    varchar(20)    not null   -- driving | on_duty | off_duty | sleeper_berth
  session_date      date           not null
  started_at        timestamptz    not null
  ended_at          timestamptz    nullable
  is_active         bool           default true
  created_at        timestamptz    not null

duty_logs
  id                PK int
  session_id        FK duty_sessions.id     not null
  contractor_id     FK contractors.id       not null
  status            varchar(20)    not null   -- driving | on_duty | off_duty | sleeper_berth
  start_time        timestamptz    not null
  end_time          timestamptz    nullable   -- null = currently active
  duration_seconds  int            nullable
  created_at        timestamptz    not null
```

## AI Reports

```
ai_inspection_reports
  id                    PK int
  contractor_id         FK contractors.id       not null (indexed)
  inspection_id         FK inspections.id       nullable (indexed)   -- optional link to a formal inspection
  title                 varchar(300)   not null
  priority              varchar(20)    not null   -- low | medium | high
  category              varchar(100)   not null
  description           varchar(2000)  not null
  recommended_actions   varchar(3000)  not null   -- JSON array as string
  raw_notes             varchar(2000)  nullable
  created_at            timestamptz    not null
```
