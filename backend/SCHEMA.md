# TR42-Contractor — Database Schema Reference

Source of truth: `backend/app/models.py`. Table names are snake_case. All FKs use the format `table.id`.

## Auth & People

```
authuser
  id                PK int
  email             varchar(360)   unique, not null
  username          varchar(360)   unique, not null
  password_hash     varchar(500)   not null
  user_type         varchar(360)   not null   -- 'vendor' | 'contractor' | 'client'
  token_version     int            not null
  is_active         bool           default true
  is_admin          bool           default false
  profile_photo     varchar(500)   nullable
  created_at        timestamptz    not null
  updated_at        timestamptz    nullable
  created_by        FK authuser.id    not null
  updated_by        FK authuser.id    nullable
  first_name        varchar(360)   not null
  last_name         varchar(360)   not null
  middle_name       varchar(360)   nullable
  contact_number    varchar(20)    not null
  alternate_number  varchar(20)    not null
  date_of_birth     date           not null
  ssn_last_four     varchar(4)     nullable
  address_id        int            not null

contractor
  id                PK
  employee_number   varchar(20)    not null
  user_id           FK authuser.id     not null
  role              varchar(360)   not null
  status            varchar(20)    not null
  tickets_completed int            not null
  tickets_open      int            not null
  biometric_enrolled bool          default false
  is_onboarded      bool           default false
  is_subcontractor  bool           default false
  is_fte            bool           default false
  is_licensed       bool           default false
  is_insured        bool           default false
  is_certified      bool           default false
  average_rating    float          nullable
  years_experience  int            nullable
  preferred_job_types varchar(500) nullable
  offline_pin       varchar(10)    nullable
  created_at        datetime       not null
  updated_at        datetime       nullable
  created_by        FK authuser.id     not null
  updated_by        FK authuser.id     nullable

vendors
  id                PK, FK authuser.id
  company_name      varchar(360)   not null
  company_code      varchar(360)   not null
  start_date        date           not null
  end_date          date           nullable
  primary_contact_name  varchar(360)   not null
  company_email         varchar(360)   not null
  company_phone         varchar(20)    not null
  status                varchar(20)    not null
  vendor_code       varchar(360)    not null
  onboarding        varchar(360)    nullable
  compliance_status varchar(360)    nullable
  description       varchar(500)    not null
  created_at        datetime       not null
  updated_at        datetime       nullable
  created_by        FK authuser.id     not null
  updated_by        FK authuser.id     nullable
  address_id        varchar(500)   not null

clients
  id                PK, FK authuser.id
  client_name       varchar(360)   not null
  client_code       varchar(360)   not null
  primary_contact_name  varchar(360)   not null
  contact_email     varchar(360)   not null
  contact_phone     varchar(20)    not null
  created_at        datetime       not null
  updated_at        datetime       nullable
  created_by        FK authuser.id     not null
  updated_by        FK authuser.id     nullable
  address_id        varchar(500)   not null
```

## Work / Tickets

```
work_orders
  id                PK int
  assigned_vendor   FK vendor.id   not null
  client_id         FK client.id   not null
  assigned_at       datetime       nullable
  completed_at      datetime       nullable
  description       varchar(500)   not null
  work_order_name   varchar(200)   not null
  estimated_start_date  date       not null
  estimated_end_date    date       not null
  current_status    varchar(360)   not null

  location          varchar(500)   not null
  location_type     varchar(360)   not null
  latitude          float          nullable
  longitude         float          nullable

  estimated_cost    float          not null
  estimated_duration float         not null
  priority          varchar(360)   not null

  comments          varchar(500)   nullable
  well_id           int            nullable
  service_type      varchar(360)   nullable
  estimated_quantity  float        nullable
  units             varchar(360)   nullable
  is_recurring      bool           not null
  recurrence_type   varchar(360)   nullable
  cancelled_at      datetime       nullable
  cancellation_reason varchar(500) nullable
  created_at        datetime       not null
  updated_at        datetime       nullable
  created_by        FK authuser.id     not null
  updated_by        FK authuser.id     nullable
  

  

tickets
  id                      PK int
  work_order_id           FK work_order.id  not null
  invoice_id              int                nullable
  vendor_id               FK vendor.id       not null
  description             varchar(500)       not null
  priority                varchar(360)       not null
  status                  varchar(360)       not null  -- to_do | in_progress | completed
  assigned_contractor     FK contractor.id
  assigned_at             timestamptz
  start_time              timestamptz        nullable
  end_time                timestamptz        nullable
  contractor_start_location  varchar(500)    nullable
  contractor_end_location    varchar(500)    nullable
  route                   varchar(500)       nullable
  estimated_quantity      float
  unit                    varchar(360)
  special_requirements    varchar(500)
  notes                   varchar(500)       nullable
  anomaly_flag            bool               default false
  anomaly_reason          varchar(500)       nullable

  created_at              datetime       not null
  updated_at              datetime       nullable
  created_by              FK authuser.id     not null
  updated_by              FK authuser.id     nullable
  additional_information  varchar (500)  nullable


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
  contractor_id     FK contractor.id           not null
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
  contractor_id     FK contractor.id   not null
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
  contractor_id         FK contractor.id       not null (indexed)
  inspection_id         FK inspections.id       nullable (indexed)   -- optional link to a formal inspection
  title                 varchar(300)   not null
  priority              varchar(20)    not null   -- low | medium | high
  category              varchar(100)   not null
  description           varchar(2000)  not null
  recommended_actions   varchar(3000)  not null   -- JSON array as string
  raw_notes             varchar(2000)  nullable
  created_at            timestamptz    not null
```
