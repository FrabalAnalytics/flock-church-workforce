-- Branch-scoped operational data.
--
-- This migration keeps the current application working by assigning all
-- existing records to the default HQ branch while preparing the core tables
-- for branch-aware queries and future RLS tightening.

do $$
declare
  default_church_id constant uuid := '00000000-0000-4000-8000-000000000201';
  default_hq_branch_id constant uuid := '00000000-0000-4000-8000-000000000202';
begin
  -- Departments and worker roster.
  alter table public.departments
    add column if not exists church_id uuid;
  alter table public.departments
    add column if not exists branch_id uuid;

  update public.departments
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.departments
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.departments
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.departments
    alter column church_id set not null;
  alter table public.departments
    alter column branch_id set not null;

  alter table public.departments
    drop constraint if exists departments_name_key;
  create unique index if not exists departments_branch_name_unique
    on public.departments (branch_id, lower(trim(name)));

  create index if not exists departments_church_id_idx
    on public.departments (church_id);
  create index if not exists departments_branch_id_idx
    on public.departments (branch_id);

  alter table public.workers
    add column if not exists church_id uuid;
  alter table public.workers
    add column if not exists branch_id uuid;

  update public.workers
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.workers
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.workers
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.workers
    alter column church_id set not null;
  alter table public.workers
    alter column branch_id set not null;

  create index if not exists workers_church_id_idx
    on public.workers (church_id);
  create index if not exists workers_branch_id_idx
    on public.workers (branch_id);

  -- Services and attendance.
  alter table public.services
    add column if not exists church_id uuid;
  alter table public.services
    add column if not exists branch_id uuid;

  update public.services
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.services
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.services
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.services
    alter column church_id set not null;
  alter table public.services
    alter column branch_id set not null;

  alter table public.services
    drop constraint if exists services_date_type_unique;
  create unique index if not exists services_branch_date_type_unique
    on public.services (branch_id, service_date, service_type);
  create index if not exists services_church_id_idx
    on public.services (church_id);
  create index if not exists services_branch_id_idx
    on public.services (branch_id);

  alter table public.attendance_submissions
    add column if not exists church_id uuid;
  alter table public.attendance_submissions
    add column if not exists branch_id uuid;

  update public.attendance_submissions
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.attendance_submissions
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.attendance_submissions
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.attendance_submissions
    alter column church_id set not null;
  alter table public.attendance_submissions
    alter column branch_id set not null;

  create index if not exists attendance_submissions_church_id_idx
    on public.attendance_submissions (church_id);
  create index if not exists attendance_submissions_branch_id_idx
    on public.attendance_submissions (branch_id);

  alter table public.attendance_logs
    add column if not exists church_id uuid;
  alter table public.attendance_logs
    add column if not exists branch_id uuid;

  update public.attendance_logs
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.attendance_logs
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.attendance_logs
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.attendance_logs
    alter column church_id set not null;
  alter table public.attendance_logs
    alter column branch_id set not null;

  create index if not exists attendance_logs_church_id_idx
    on public.attendance_logs (church_id);
  create index if not exists attendance_logs_branch_id_idx
    on public.attendance_logs (branch_id);

  alter table public.service_department_expectations
    add column if not exists church_id uuid;
  alter table public.service_department_expectations
    add column if not exists branch_id uuid;

  update public.service_department_expectations as expectation
  set church_id = service.church_id,
      branch_id = service.branch_id
  from public.services as service
  where expectation.service_id = service.id
    and (expectation.church_id is null or expectation.branch_id is null);

  alter table public.service_department_expectations
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.service_department_expectations
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.service_department_expectations
    alter column church_id set not null;
  alter table public.service_department_expectations
    alter column branch_id set not null;

  create index if not exists service_department_expectations_church_id_idx
    on public.service_department_expectations (church_id);
  create index if not exists service_department_expectations_branch_id_idx
    on public.service_department_expectations (branch_id);

  alter table public.service_control_events
    add column if not exists church_id uuid;
  alter table public.service_control_events
    add column if not exists branch_id uuid;

  update public.service_control_events as event
  set church_id = service.church_id,
      branch_id = service.branch_id
  from public.services as service
  where event.service_id = service.id
    and (event.church_id is null or event.branch_id is null);

  alter table public.service_control_events
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.service_control_events
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.service_control_events
    alter column church_id set not null;
  alter table public.service_control_events
    alter column branch_id set not null;

  create index if not exists service_control_events_church_id_idx
    on public.service_control_events (church_id);
  create index if not exists service_control_events_branch_id_idx
    on public.service_control_events (branch_id);

  alter table public.church_attendance
    add column if not exists church_id uuid;
  alter table public.church_attendance
    add column if not exists branch_id uuid;

  update public.church_attendance
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.church_attendance
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.church_attendance
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.church_attendance
    alter column church_id set not null;
  alter table public.church_attendance
    alter column branch_id set not null;

  drop index if exists church_attendance_date_unique;
  create unique index if not exists church_attendance_branch_date_unique
    on public.church_attendance (branch_id, attendance_date);
  create index if not exists church_attendance_church_id_idx
    on public.church_attendance (church_id);
  create index if not exists church_attendance_branch_id_idx
    on public.church_attendance (branch_id);

  -- Programme templates and dated programmes.
  alter table public.service_programme_templates
    add column if not exists church_id uuid;
  alter table public.service_programme_templates
    add column if not exists branch_id uuid;

  update public.service_programme_templates
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.service_programme_templates
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.service_programme_templates
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.service_programme_templates
    alter column church_id set not null;
  alter table public.service_programme_templates
    alter column branch_id set not null;

  alter table public.service_programme_templates
    drop constraint if exists service_programme_templates_name_key;
  create unique index if not exists service_programme_templates_branch_name_unique
    on public.service_programme_templates (branch_id, lower(trim(name)));

  create index if not exists service_programme_templates_church_id_idx
    on public.service_programme_templates (church_id);
  create index if not exists service_programme_templates_branch_id_idx
    on public.service_programme_templates (branch_id);

  alter table public.service_programme_template_items
    add column if not exists church_id uuid;
  alter table public.service_programme_template_items
    add column if not exists branch_id uuid;

  update public.service_programme_template_items as item
  set church_id = template.church_id,
      branch_id = template.branch_id
  from public.service_programme_templates as template
  where item.template_id = template.id
    and (item.church_id is null or item.branch_id is null);

  alter table public.service_programme_template_items
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.service_programme_template_items
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.service_programme_template_items
    alter column church_id set not null;
  alter table public.service_programme_template_items
    alter column branch_id set not null;

  create index if not exists service_programme_template_items_church_id_idx
    on public.service_programme_template_items (church_id);
  create index if not exists service_programme_template_items_branch_id_idx
    on public.service_programme_template_items (branch_id);

  alter table public.service_programmes
    add column if not exists church_id uuid;
  alter table public.service_programmes
    add column if not exists branch_id uuid;

  update public.service_programmes
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;

  alter table public.service_programmes
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.service_programmes
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.service_programmes
    alter column church_id set not null;
  alter table public.service_programmes
    alter column branch_id set not null;

  alter table public.service_programmes
    drop constraint if exists service_programmes_service_date_service_type_key;
  create unique index if not exists service_programmes_branch_date_type_unique
    on public.service_programmes (branch_id, service_date, service_type);
  create index if not exists service_programmes_church_id_idx
    on public.service_programmes (church_id);
  create index if not exists service_programmes_branch_id_idx
    on public.service_programmes (branch_id);

  alter table public.service_programme_items
    add column if not exists church_id uuid;
  alter table public.service_programme_items
    add column if not exists branch_id uuid;

  update public.service_programme_items as item
  set church_id = programme.church_id,
      branch_id = programme.branch_id
  from public.service_programmes as programme
  where item.programme_id = programme.id
    and (item.church_id is null or item.branch_id is null);

  alter table public.service_programme_items
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.service_programme_items
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.service_programme_items
    alter column church_id set not null;
  alter table public.service_programme_items
    alter column branch_id set not null;

  create index if not exists service_programme_items_church_id_idx
    on public.service_programme_items (church_id);
  create index if not exists service_programme_items_branch_id_idx
    on public.service_programme_items (branch_id);

  -- Follow-up and caretaker flows.
  alter table public.absence_followups
    add column if not exists church_id uuid;
  alter table public.absence_followups
    add column if not exists branch_id uuid;

  update public.absence_followups as followup
  set church_id = worker.church_id,
      branch_id = worker.branch_id
  from public.workers as worker
  where followup.worker_id = worker.id
    and (followup.church_id is null or followup.branch_id is null);

  alter table public.absence_followups
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.absence_followups
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.absence_followups
    alter column church_id set not null;
  alter table public.absence_followups
    alter column branch_id set not null;

  create index if not exists absence_followups_church_id_idx
    on public.absence_followups (church_id);
  create index if not exists absence_followups_branch_id_idx
    on public.absence_followups (branch_id);

  alter table public.followup_events
    add column if not exists church_id uuid;
  alter table public.followup_events
    add column if not exists branch_id uuid;

  update public.followup_events as event
  set church_id = worker.church_id,
      branch_id = worker.branch_id
  from public.workers as worker
  where event.worker_id = worker.id
    and (event.church_id is null or event.branch_id is null);

  alter table public.followup_events
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.followup_events
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.followup_events
    alter column church_id set not null;
  alter table public.followup_events
    alter column branch_id set not null;

  create index if not exists followup_events_church_id_idx
    on public.followup_events (church_id);
  create index if not exists followup_events_branch_id_idx
    on public.followup_events (branch_id);

  -- First-timer care and operational metadata.
  alter table public.first_timers
    add column if not exists church_id uuid;
  alter table public.first_timers
    add column if not exists branch_id uuid;
  update public.first_timers
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;
  alter table public.first_timers
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.first_timers
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.first_timers
    alter column church_id set not null;
  alter table public.first_timers
    alter column branch_id set not null;

  alter table public.first_timer_interactions
    add column if not exists church_id uuid;
  alter table public.first_timer_interactions
    add column if not exists branch_id uuid;
  update public.first_timer_interactions as interaction
  set church_id = ft.church_id,
      branch_id = ft.branch_id
  from public.first_timers as ft
  where interaction.first_timer_id = ft.id
    and (interaction.church_id is null or interaction.branch_id is null);
  alter table public.first_timer_interactions
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.first_timer_interactions
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.first_timer_interactions
    alter column church_id set not null;
  alter table public.first_timer_interactions
    alter column branch_id set not null;

  alter table public.first_timer_visits
    add column if not exists church_id uuid;
  alter table public.first_timer_visits
    add column if not exists branch_id uuid;
  update public.first_timer_visits as visit
  set church_id = ft.church_id,
      branch_id = ft.branch_id
  from public.first_timers as ft
  where visit.first_timer_id = ft.id
    and (visit.church_id is null or visit.branch_id is null);
  alter table public.first_timer_visits
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.first_timer_visits
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.first_timer_visits
    alter column church_id set not null;
  alter table public.first_timer_visits
    alter column branch_id set not null;

  alter table public.first_timer_stage_history
    add column if not exists church_id uuid;
  alter table public.first_timer_stage_history
    add column if not exists branch_id uuid;
  update public.first_timer_stage_history as history
  set church_id = ft.church_id,
      branch_id = ft.branch_id
  from public.first_timers as ft
  where history.first_timer_id = ft.id
    and (history.church_id is null or history.branch_id is null);
  alter table public.first_timer_stage_history
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.first_timer_stage_history
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.first_timer_stage_history
    alter column church_id set not null;
  alter table public.first_timer_stage_history
    alter column branch_id set not null;

  -- Housekeeping and export metadata.
  alter table public.ministers
    add column if not exists church_id uuid;
  update public.ministers
  set church_id = default_church_id
  where church_id is null;
  alter table public.ministers
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.ministers
    alter column church_id set not null;

  alter table public.audit_events
    add column if not exists church_id uuid;
  alter table public.audit_events
    add column if not exists branch_id uuid;
  update public.audit_events
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;
  alter table public.audit_events
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.audit_events
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.audit_events
    alter column church_id set not null;
  alter table public.audit_events
    alter column branch_id set not null;

  alter table public.notification_states
    add column if not exists church_id uuid;
  alter table public.notification_states
    add column if not exists branch_id uuid;
  update public.notification_states as state
  set church_id = profile.church_id,
      branch_id = profile.branch_id
  from public.profiles as profile
  where state.user_id = profile.id
    and (state.church_id is null or state.branch_id is null);
  alter table public.notification_states
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.notification_states
    alter column branch_id set default '00000000-0000-4000-8000-000000000202';
  alter table public.notification_states
    alter column church_id set not null;
  alter table public.notification_states
    alter column branch_id set not null;

  alter table public.system_job_runs
    add column if not exists church_id uuid;
  update public.system_job_runs
  set church_id = default_church_id
  where church_id is null;
  alter table public.system_job_runs
    alter column church_id set default '00000000-0000-4000-8000-000000000201';
  alter table public.system_job_runs
    alter column church_id set not null;
end;
$$;
