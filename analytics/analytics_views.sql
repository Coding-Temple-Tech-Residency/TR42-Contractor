-- Auto-generated from SCHEMA.md (TR42-Contractor)
-- Creates analytics dimensions, facts, and a denormalized gold view for tickets.

create schema if not exists analytics;

-- 1) Core identity dimension
create or replace view analytics.dim_user as
select
  au.id            as user_id,
  au.email,
  au.username,
  au.role,
  au.is_active,
  au.profile_photo,
  au.created_at,
  au.updated_at,
  au.created_by,
  au.updated_by
from auth_users au;

-- 2) Vendor dimension (vendors.id is also auth_users.id)
create or replace view analytics.dim_vendor as
select
  v.id            as vendor_id,
  du.email        as vendor_email,
  du.username     as vendor_username,
  du.is_active    as vendor_is_active,
  v.first_name    as vendor_first_name,
  v.last_name     as vendor_last_name
from vendors v
join analytics.dim_user du
  on du.user_id = v.id;

-- 3) Contractor dimension (contractors.id is also auth_users.id)
create or replace view analytics.dim_contractor as
select
  c.id                 as contractor_id,
  du.email             as contractor_email,
  du.username          as contractor_username,
  du.is_active         as contractor_is_active,

  c.vendor_id          as vendor_id,
  dv.vendor_email      as vendor_email,
  dv.vendor_username   as vendor_username,

  c.manager_id         as manager_user_id,
  mu.email             as manager_email,
  mu.username          as manager_username,
  mu.is_active         as manager_is_active,

  c.first_name,
  c.last_name,
  c.license_number,
  c.expiration_date,
  c.contractor_type,
  c.status,
  c.tax_classification,
  c.contact_number,
  c.date_of_birth,
  c.address,
  c.offline_pin
from contractors c
join analytics.dim_user du
  on du.user_id = c.id
join analytics.dim_vendor dv
  on dv.vendor_id = c.vendor_id
join analytics.dim_user mu
  on mu.user_id = c.manager_id;

-- 4) Work orders fact-like view (header-level)
create or replace view analytics.fact_work_orders as
select
  wo.id                 as work_order_id,
  wo.assigned_vendor     as vendor_id,
  wo.created_at,
  wo.description,
  wo.due_date,
  wo.current_status,
  wo.location,
  wo.estimated_cost,
  wo.estimated_duration,
  wo.priority
from work_orders wo;

-- 5) Tickets fact (one row per ticket)
create or replace view analytics.fact_tickets as
select
  t.id                      as ticket_id,
  t.work_order_id,
  t.vendor_id,
  t.description,
  t.priority,
  t.status,
  t.assigned_contractor     as contractor_id,
  t.contractor_assigned_at,
  t.created_at,
  t.start_time,
  t.end_time,
  t.start_location,
  t.end_location,
  t.designated_route,
  t.estimated_quantity,
  t.unit,
  t.special_requirements,
  t.contractor_notes,
  t.anomaly_flag,
  t.anomaly_reason
from tickets t;

-- 6) Denormalized gold view for BI (one row per ticket, human readable columns)
create or replace view analytics.gold_tickets as
select
  ft.ticket_id,

  ft.created_at                             as ticket_created_at,
  date_trunc('day', ft.created_at)::date    as ticket_created_date,

  ft.work_order_id,
  wo.description                            as work_order_description,
  wo.due_date                               as work_order_due_date,
  wo.current_status                         as work_order_status,
  wo.location                               as work_order_location,
  wo.estimated_cost                         as work_order_estimated_cost,
  wo.estimated_duration                     as work_order_estimated_duration,
  wo.priority                               as work_order_priority,

  ft.vendor_id,
  dv.vendor_email,
  dv.vendor_username,
  dv.vendor_first_name,
  dv.vendor_last_name,

  ft.status                                 as ticket_status,
  ft.priority                               as ticket_priority,
  ft.description                            as ticket_description,

  ft.contractor_id,
  dc.contractor_email,
  dc.contractor_username,
  dc.first_name                             as contractor_first_name,
  dc.last_name                              as contractor_last_name,
  dc.contractor_type,
  dc.status                                 as contractor_status,

  dc.manager_user_id                        as contractor_manager_user_id,
  dc.manager_email                          as contractor_manager_email,
  dc.manager_username                       as contractor_manager_username,

  ft.contractor_assigned_at,
  ft.start_time,
  ft.end_time,
  ft.start_location,
  ft.end_location,
  ft.designated_route,
  ft.estimated_quantity,
  ft.unit,
  ft.special_requirements,
  ft.contractor_notes,
  ft.anomaly_flag,
  ft.anomaly_reason
from analytics.fact_tickets ft
join analytics.fact_work_orders wo
  on wo.work_order_id = ft.work_order_id
join analytics.dim_vendor dv
  on dv.vendor_id = ft.vendor_id
left join analytics.dim_contractor dc
  on dc.contractor_id = ft.contractor_id;

-- 7) Daily rollup
create or replace view analytics.gold_tickets_daily as
select
  gt.ticket_created_date as day,
  gt.vendor_id,
  gt.vendor_email,
  gt.contractor_id,
  gt.contractor_email,
  gt.contractor_manager_email,
  count(*) as tickets_created,
  count(*) filter (where gt.ticket_status = 'completed') as tickets_completed,
  count(*) filter (where gt.ticket_status = 'in_progress') as tickets_in_progress,
  count(*) filter (where gt.ticket_status = 'to_do') as tickets_to_do
from analytics.gold_tickets gt
group by 1,2,3,4,5,6;
