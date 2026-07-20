-- Flock database schema (single-church version)
-- Run in the Supabase SQL Editor as the project owner.
--
-- This file is the readable current-state snapshot. New database changes must
-- also be recorded as timestamped files in supabase/migrations; see
-- supabase/MIGRATIONS.md.

create extension if not exists "pgcrypto";

-- Tables --------------------------------------------------------------------

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone_number text,
  role text not null default 'pending',
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text;

update public.profiles as p
set email = u.email
from auth.users as u
where p.id = u.id
  and p.email is distinct from u.email;

-- Replace the original role constraint when upgrading an existing draft schema.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('pending', 'super_admin', 'church_leader', 'department_head'));

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text,
  sex text check (sex is null or sex in ('Male', 'Female')),
  whatsapp_opt_in boolean not null default false,
  whatsapp_opted_in_at timestamptz,
  whatsapp_opted_out_at timestamptz,
  department_id uuid not null references public.departments(id),
  status text not null default 'Active'
    check (status in ('Active', 'Inactive', 'On Leave')),
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.workers
  add column if not exists whatsapp_opt_in boolean not null default false;
alter table public.workers
  add column if not exists sex text;
alter table public.workers
  add column if not exists whatsapp_opted_in_at timestamptz;
alter table public.workers
  add column if not exists whatsapp_opted_out_at timestamptz;

alter table public.workers
  drop constraint if exists workers_sex_check;
alter table public.workers
  add constraint workers_sex_check
  check (sex is null or sex in ('Male', 'Female'));

alter table public.workers
  drop constraint if exists workers_whatsapp_preference_state;
alter table public.workers
  add constraint workers_whatsapp_preference_state
  check (
    (whatsapp_opt_in = true and whatsapp_opted_in_at is not null
      and whatsapp_opted_out_at is null)
    or whatsapp_opt_in = false
  );

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  service_type text not null check (service_type in (
    'Sunday Service',
    'Tuesday Service',
    'Special Service',
    'Headquarters Service',
    'Tarry Night'
  )),
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now()
);

-- One submission represents one department completing the checklist for one
-- service. This is the source for the service log and dashboard KPIs.
create table if not exists public.attendance_submissions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  department_id uuid not null references public.departments(id),
  submitted_by uuid not null references public.profiles(id),
  roster_count integer not null check (roster_count >= 0),
  present_count integer not null check (present_count >= 0),
  absent_count integer not null check (absent_count >= 0),
  submitted_at timestamptz not null default now(),
  check (roster_count = present_count + absent_count),
  unique (service_id, department_id)
);

alter table public.attendance_submissions
  add column if not exists corrected_by uuid
  references public.profiles(id) on delete set null;
alter table public.attendance_submissions
  add column if not exists corrected_at timestamptz;

-- Super-admin managed directory used to keep minister names consistent.
create table if not exists public.ministers (
  id uuid primary key default gen_random_uuid(),
  title text,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(full_name)) between 2 and 120),
  check (title is null or char_length(trim(title)) between 2 and 40)
);

create unique index if not exists ministers_display_name_unique
  on public.ministers (
    lower(coalesce(trim(title), '') || '|' || trim(full_name))
  );

-- Congregation attendance is intentionally aggregate-only. It shares the
-- service calendar with worker attendance without storing attendee identities.
create table if not exists public.church_attendance (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null unique references public.services(id) on delete cascade,
  attendance_date date not null,
  minister_id uuid references public.ministers(id) on delete restrict,
  service_notes text,
  adult_male_count integer not null default 0 check (adult_male_count >= 0),
  adult_female_count integer not null default 0 check (adult_female_count >= 0),
  children_count integer not null default 0 check (children_count >= 0),
  new_members_male_count integer not null default 0,
  new_members_female_count integer not null default 0,
  new_converts_male_count integer not null default 0,
  new_converts_female_count integer not null default 0,
  total_count integer generated always as (
    adult_male_count + adult_female_count + children_count
  ) stored,
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Upgrade church-attendance drafts created before the one-record-per-day rule.
alter table public.church_attendance
  add column if not exists attendance_date date;
alter table public.church_attendance
  add column if not exists minister_id uuid
  references public.ministers(id) on delete restrict;
alter table public.church_attendance
  add column if not exists service_notes text;
alter table public.church_attendance
  add column if not exists new_members_male_count integer not null default 0;
alter table public.church_attendance
  add column if not exists new_members_female_count integer not null default 0;
alter table public.church_attendance
  add column if not exists new_converts_male_count integer not null default 0;
alter table public.church_attendance
  add column if not exists new_converts_female_count integer not null default 0;

update public.church_attendance as attendance
set attendance_date = service.service_date
from public.services as service
where attendance.service_id = service.id
  and attendance.attendance_date is null;

alter table public.church_attendance
  alter column attendance_date set not null;

alter table public.church_attendance
  drop constraint if exists church_attendance_service_notes_length;
alter table public.church_attendance
  add constraint church_attendance_service_notes_length
  check (service_notes is null or char_length(service_notes) <= 2000);

-- New members and new converts are mutually exclusive adult subsets. Their
-- counts are already included in the adult totals and never increase total_count.
alter table public.church_attendance
  drop constraint if exists church_attendance_newcomer_counts_nonnegative;
alter table public.church_attendance
  add constraint church_attendance_newcomer_counts_nonnegative
  check (
    new_members_male_count >= 0
    and new_members_female_count >= 0
    and new_converts_male_count >= 0
    and new_converts_female_count >= 0
  );

alter table public.church_attendance
  drop constraint if exists church_attendance_male_newcomer_subset;
alter table public.church_attendance
  add constraint church_attendance_male_newcomer_subset
  check (
    new_members_male_count + new_converts_male_count <= adult_male_count
  );

alter table public.church_attendance
  drop constraint if exists church_attendance_female_newcomer_subset;
alter table public.church_attendance
  add constraint church_attendance_female_newcomer_subset
  check (
    new_members_female_count + new_converts_female_count <= adult_female_count
  );

-- Reusable service-programme templates are copied into dated programme
-- records, so later template changes never rewrite an already planned service.
create table if not exists public.service_programme_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(name)) between 3 and 120)
);

create table if not exists public.service_programme_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.service_programme_templates(id)
    on delete cascade,
  position integer not null check (position > 0),
  start_time time not null,
  end_time time not null,
  event_name text not null,
  responsible_name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  unique (template_id, position),
  check (end_time > start_time),
  check (char_length(trim(event_name)) between 2 and 160),
  check (char_length(trim(responsible_name)) between 2 and 160)
);

create table if not exists public.service_programmes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.service_programme_templates(id)
    on delete set null,
  service_date date not null,
  service_type text not null check (service_type in (
    'Sunday Service', 'Tuesday Service', 'Special Service',
    'Headquarters Service', 'Tarry Night'
  )),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  unique (service_date, service_type),
  check (char_length(trim(title)) between 3 and 160),
  check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create table if not exists public.service_programme_items (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.service_programmes(id)
    on delete cascade,
  position integer not null check (position > 0),
  start_time time not null,
  end_time time not null,
  event_name text not null,
  responsible_name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  unique (programme_id, position),
  check (end_time > start_time),
  check (char_length(trim(event_name)) between 2 and 160),
  check (char_length(trim(responsible_name)) between 2 and 160)
);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.attendance_submissions(id)
    on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  department_id uuid not null references public.departments(id),
  status text not null check (status in ('Present', 'Absent')),
  submitted_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  unique (service_id, worker_id)
);

alter table public.attendance_logs
  add column if not exists submission_id uuid
  references public.attendance_submissions(id) on delete cascade;

create table if not exists public.absence_followups (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  consecutive_misses integer not null default 1,
  whatsapp_sent boolean not null default false,
  whatsapp_sent_at timestamptz,
  notes text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Every escalation is recorded separately. Message events are picked up by a
-- trusted server/Edge Function, sent through Twilio, and updated with delivery
-- status. Dashboard-only alerts use the not_applicable status.
create table if not exists public.followup_events (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references public.absence_followups(id)
    on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  miss_count integer not null check (miss_count > 0),
  event_type text not null check (event_type in (
    'soft_message',
    'department_alert',
    'urgent_message',
    'pastoral_alert'
  )),
  message_body text,
  delivery_status text not null default 'not_applicable' check (
    delivery_status in (
      'not_applicable', 'queued', 'processing', 'sent', 'delivered', 'failed', 'cancelled'
    )
  ),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  unique (worker_id, service_id, event_type)
);

alter table public.followup_events
  drop constraint if exists followup_events_delivery_status_check;
alter table public.followup_events
  add constraint followup_events_delivery_status_check
  check (
    delivery_status in (
      'not_applicable', 'queued', 'processing', 'sent', 'delivered', 'failed', 'cancelled'
    )
  );

-- Upgrade the original service-type constraint when this schema is re-run.
alter table public.services
  drop constraint if exists services_service_type_check;
alter table public.services
  add constraint services_service_type_check
  check (service_type in (
    'Sunday Service',
    'Tuesday Service',
    'Special Service',
    'Headquarters Service',
    'Tarry Night'
  ));

-- Named constraints make this section safe to re-run and also upgrade the
-- original draft when those tables already exist.
alter table public.absence_followups
  drop constraint if exists absence_followups_positive_misses;
alter table public.absence_followups
  add constraint absence_followups_positive_misses
  check (consecutive_misses > 0);

alter table public.absence_followups
  drop constraint if exists absence_followups_whatsapp_state;
alter table public.absence_followups
  add constraint absence_followups_whatsapp_state
  check (
    (whatsapp_sent = false and whatsapp_sent_at is null)
    or (whatsapp_sent = true and whatsapp_sent_at is not null)
  );

alter table public.absence_followups
  drop constraint if exists absence_followups_resolution_state;
alter table public.absence_followups
  add constraint absence_followups_resolution_state
  check (
    (resolved = false and resolved_at is null)
    or (resolved = true and resolved_at is not null)
  );

create unique index if not exists one_open_followup_per_worker
  on public.absence_followups (worker_id)
  where resolved = false;

create unique index if not exists services_date_type_unique
  on public.services (service_date, service_type);

create index if not exists profiles_department_id_idx
  on public.profiles (department_id);
create index if not exists workers_department_id_idx
  on public.workers (department_id);
create index if not exists attendance_logs_service_id_idx
  on public.attendance_logs (service_id);
create index if not exists attendance_submissions_service_id_idx
  on public.attendance_submissions (service_id);
create index if not exists attendance_submissions_department_id_idx
  on public.attendance_submissions (department_id);
create index if not exists church_attendance_service_id_idx
  on public.church_attendance (service_id);
create unique index if not exists church_attendance_date_unique
  on public.church_attendance (attendance_date);
create index if not exists attendance_logs_worker_id_idx
  on public.attendance_logs (worker_id);
create index if not exists attendance_logs_department_id_idx
  on public.attendance_logs (department_id);
create index if not exists absence_followups_worker_id_idx
  on public.absence_followups (worker_id);
create index if not exists absence_followups_service_id_idx
  on public.absence_followups (service_id);
create index if not exists followup_events_worker_id_idx
  on public.followup_events (worker_id);
create index if not exists followup_events_delivery_status_idx
  on public.followup_events (delivery_status)
  where delivery_status in ('queued', 'processing', 'sent');

-- Authentication and authorization helpers ---------------------------------

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid());
$$;

create or replace function public.current_department_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.department_id
  from public.profiles as p
  where p.id = (select auth.uid());
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() = 'super_admin', false);
$$;

create or replace function public.is_church_leader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_profile_role() in ('super_admin', 'church_leader'),
    false
  );
$$;

revoke all on function public.current_profile_role() from public;
revoke all on function public.current_department_id() from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.is_church_leader() from public;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_department_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_church_leader() to authenticated;

-- Automatically create a non-privileged profile for every new Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone_number, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New user'
    ),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone_number'), ''),
    'pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Defense in depth: authenticated users cannot change profile identity,
-- contact or authorization fields unless they are a Super Admin.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not public.is_super_admin()
  then
    raise exception 'Only a super admin can change profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Keep an auditable timestamp whenever a worker opts into or out of automated
-- WhatsApp care messages.
create or replace function public.prepare_worker_messaging_preference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.whatsapp_opt_in = true then
    new.whatsapp_opted_in_at := coalesce(new.whatsapp_opted_in_at, now());
    new.whatsapp_opted_out_at := null;
  elsif tg_op = 'UPDATE'
    and old.whatsapp_opt_in is distinct from new.whatsapp_opt_in
  then
    if new.whatsapp_opt_in = true then
      new.whatsapp_opted_in_at := now();
      new.whatsapp_opted_out_at := null;
    else
      new.whatsapp_opted_out_at := now();

      update public.followup_events
      set delivery_status = 'cancelled',
          error_message = 'Cancelled because the worker opted out before sending'
      where worker_id = new.id
        and delivery_status = 'queued';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_worker_messaging_preference on public.workers;
create trigger prepare_worker_messaging_preference
  before insert or update of whatsapp_opt_in on public.workers
  for each row execute function public.prepare_worker_messaging_preference();

-- Record the real service creator and keep that audit field immutable.
create or replace function public.prepare_service()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_service on public.services;
create trigger prepare_service
  before insert or update on public.services
  for each row execute function public.prepare_service();

-- Always derive attendance ownership from the selected worker, and prevent
-- browser clients from impersonating another submitter.
create or replace function public.prepare_attendance_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select w.department_id
    into new.department_id
  from public.workers as w
  where w.id = new.worker_id;

  if new.department_id is null then
    raise exception 'The selected worker does not exist';
  end if;

  if (select auth.uid()) is not null then
    new.submitted_by := (select auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_attendance_log on public.attendance_logs;
create trigger prepare_attendance_log
  before insert or update
  on public.attendance_logs
  for each row execute function public.prepare_attendance_log();

-- Recalculate one worker's consecutive misses whenever their attendance
-- changes. Active church workers are expected at each logged service unless
-- they have been placed On Leave or made Inactive before submission.
create or replace function public.process_worker_absence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendance_row record;
  miss_total integer := 0;
  followup_uuid uuid;
  worker_name text;
  department_name text;
  current_service_type text;
  next_event_type text;
  next_message text;
  next_delivery_status text := 'not_applicable';
  latest_absent_service_id uuid;
  worker_whatsapp_opt_in boolean;
begin
  for attendance_row in
    select al.status, al.service_id
    from public.attendance_logs as al
    join public.services as s on s.id = al.service_id
    where al.worker_id = new.worker_id
    order by s.service_date desc, al.created_at desc
  loop
    exit when attendance_row.status = 'Present';
    latest_absent_service_id := coalesce(
      latest_absent_service_id,
      attendance_row.service_id
    );
    miss_total := miss_total + 1;
  end loop;

  if miss_total = 0 then
    update public.absence_followups
    set resolved = true,
        resolved_at = now()
    where worker_id = new.worker_id
      and resolved = false;

    return new;
  end if;

  insert into public.absence_followups (
    worker_id,
    service_id,
    consecutive_misses,
    resolved,
    resolved_at
  )
  values (new.worker_id, latest_absent_service_id, miss_total, false, null)
  on conflict (worker_id) where resolved = false
  do update set
    service_id = excluded.service_id,
    consecutive_misses = excluded.consecutive_misses
  returning id into followup_uuid;

  select w.full_name, d.name, s.service_type, w.whatsapp_opt_in
    into worker_name, department_name, current_service_type,
      worker_whatsapp_opt_in
  from public.workers as w
  join public.departments as d on d.id = w.department_id
  join public.services as s on s.id = latest_absent_service_id
  where w.id = new.worker_id;

  case miss_total
    when 1 then
      if worker_whatsapp_opt_in then
        next_event_type := 'soft_message';
        next_delivery_status := 'queued';
        next_message := format(
          'Hi %s, we missed you at %s today and wanted to check that you''re doing well. We hope to see you soon. — TREM %s',
          worker_name,
          current_service_type,
          department_name
        );
      end if;
    when 2 then
      next_event_type := 'department_alert';
    when 4 then
      if worker_whatsapp_opt_in then
        next_event_type := 'urgent_message';
        next_delivery_status := 'queued';
        next_message := format(
          'Hi %s, we have missed you at several services and wanted to reach out personally. Please let your %s leader know how you are doing. You are important to us. — TREM',
          worker_name,
          department_name
        );
      end if;
    when 6 then
      next_event_type := 'pastoral_alert';
    else
      next_event_type := null;
  end case;

  if next_event_type is not null then
    insert into public.followup_events (
      followup_id,
      worker_id,
      service_id,
      miss_count,
      event_type,
      message_body,
      delivery_status
    )
    values (
      followup_uuid,
      new.worker_id,
      latest_absent_service_id,
      miss_total,
      next_event_type,
      next_message,
      next_delivery_status
    )
    on conflict (worker_id, service_id, event_type) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists process_worker_absence on public.attendance_logs;
create trigger process_worker_absence
  after insert or update of status
  on public.attendance_logs
  for each row execute function public.process_worker_absence();

-- Approved leave and inactive status immediately remove a worker from the
-- active care queue without deleting their attendance history.
create or replace function public.resolve_followup_for_unavailable_worker()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('On Leave', 'Inactive') then
    update public.absence_followups
    set resolved = true,
        resolved_at = now(),
        notes = coalesce(notes || E'\n', '')
          || 'Resolved automatically because worker status changed to '
          || new.status
    where worker_id = new.id
      and resolved = false;
  end if;

  return new;
end;
$$;

drop trigger if exists resolve_followup_for_unavailable_worker
  on public.workers;
create trigger resolve_followup_for_unavailable_worker
  after update of status on public.workers
  for each row
  when (old.status is distinct from new.status)
  execute function public.resolve_followup_for_unavailable_worker();

-- The app calls this function once when a department head taps Submit. It
-- creates/reuses the service, records a single submission, and writes Present
-- or Absent for every Active worker in that department as one transaction.
create or replace function public.submit_department_attendance(
  p_service_type text,
  p_present_worker_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_department_id uuid := public.current_department_id();
  service_uuid uuid;
  submission_uuid uuid;
  service_day date := (now() at time zone 'Africa/Lagos')::date;
  active_count integer;
  present_total integer;
  invalid_present_count integer;
begin
  if actor_id is null
     or public.current_profile_role() <> 'department_head'
     or actor_department_id is null
  then
    raise exception 'Only an assigned department head can submit attendance';
  end if;

  if p_service_type not in (
    'Sunday Service',
    'Tuesday Service',
    'Special Service',
    'Headquarters Service',
    'Tarry Night'
  ) then
    raise exception 'Invalid service type';
  end if;

  select count(*)
    into invalid_present_count
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id)
  left join public.workers as w on w.id = selected.id
  where w.id is null
     or w.department_id <> actor_department_id
     or w.status <> 'Active';

  if invalid_present_count > 0 then
    raise exception 'The present list contains a worker outside your active department roster';
  end if;

  insert into public.services (service_date, service_type, created_by)
  values (service_day, p_service_type, actor_id)
  on conflict (service_date, service_type)
  do update set service_date = excluded.service_date
  returning id into service_uuid;

  if exists (
    select 1
    from public.attendance_submissions as existing
    where existing.service_id = service_uuid
      and existing.department_id = actor_department_id
  ) then
    raise exception 'Attendance has already been submitted for this department and service';
  end if;

  select count(*)
    into active_count
  from public.workers
  where department_id = actor_department_id
    and status = 'Active';

  select count(distinct selected.id)
    into present_total
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id);

  insert into public.attendance_submissions (
    service_id,
    department_id,
    submitted_by,
    roster_count,
    present_count,
    absent_count,
    submitted_at
  )
  values (
    service_uuid,
    actor_department_id,
    actor_id,
    active_count,
    present_total,
    active_count - present_total,
    now()
  )
  returning id into submission_uuid;

  insert into public.attendance_logs (
    submission_id,
    service_id,
    worker_id,
    department_id,
    status,
    submitted_by,
    created_at
  )
  select
    submission_uuid,
    service_uuid,
    w.id,
    actor_department_id,
    case
      when w.id = any(coalesce(p_present_worker_ids, array[]::uuid[]))
        then 'Present'
      else 'Absent'
    end,
    actor_id,
    now()
  from public.workers as w
  where w.department_id = actor_department_id
    and w.status = 'Active'
  on conflict (service_id, worker_id)
  do update set
    submission_id = excluded.submission_id,
    status = excluded.status,
    submitted_by = excluded.submitted_by,
    created_at = excluded.created_at;

  return submission_uuid;
end;
$$;

revoke all on function public.submit_department_attendance(text, uuid[])
  from public;
grant execute on function public.submit_department_attendance(text, uuid[])
  to authenticated;

-- Remove the earlier five-argument draft before installing the expanded RPC.
drop function if exists public.submit_church_attendance(
  date, text, integer, integer, integer
);
drop function if exists public.submit_church_attendance(
  date, text, integer, integer, integer, integer, integer, integer, integer
);

-- Super admins record one aggregate congregation total per calendar date.
-- Church leaders receive read-only access through RLS.
create or replace function public.submit_church_attendance(
  p_service_date date,
  p_service_type text,
  p_adult_male_count integer,
  p_adult_female_count integer,
  p_children_count integer,
  p_new_members_male_count integer,
  p_new_members_female_count integer,
  p_new_converts_male_count integer,
  p_new_converts_female_count integer,
  p_minister_id uuid,
  p_service_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  service_uuid uuid;
  attendance_uuid uuid;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can record church attendance';
  end if;

  if p_minister_id is null or not exists (
    select 1 from public.ministers as minister
    where minister.id = p_minister_id and minister.active = true
  ) then
    raise exception 'Select an active minister from the Minister Directory';
  end if;

  if char_length(trim(coalesce(p_service_notes, ''))) > 2000 then
    raise exception 'Service notes cannot exceed 2000 characters';
  end if;

  if p_service_date is null or p_service_date > (now() at time zone 'Africa/Lagos')::date then
    raise exception 'Select a valid service date that is not in the future';
  end if;

  if p_service_type not in (
    'Sunday Service',
    'Tuesday Service',
    'Special Service',
    'Headquarters Service',
    'Tarry Night'
  ) then
    raise exception 'Invalid service type';
  end if;

  if coalesce(p_adult_male_count, -1) < 0
     or coalesce(p_adult_female_count, -1) < 0
     or coalesce(p_children_count, -1) < 0
     or coalesce(p_new_members_male_count, -1) < 0
     or coalesce(p_new_members_female_count, -1) < 0
     or coalesce(p_new_converts_male_count, -1) < 0
     or coalesce(p_new_converts_female_count, -1) < 0
  then
    raise exception 'Attendance counts cannot be negative';
  end if;

  if p_new_members_male_count + p_new_converts_male_count > p_adult_male_count
     or p_new_members_female_count + p_new_converts_female_count > p_adult_female_count
  then
    raise exception 'New members and new converts must be distinct people included in the matching adult total';
  end if;

  if exists (
    select 1
    from public.church_attendance as attendance
    where attendance.attendance_date = p_service_date
  ) then
    raise exception 'Church attendance has already been recorded for this date';
  end if;

  insert into public.services (service_date, service_type, created_by)
  values (p_service_date, p_service_type, actor_id)
  on conflict (service_date, service_type)
  do update set service_date = excluded.service_date
  returning id into service_uuid;

  insert into public.church_attendance (
    service_id,
    attendance_date,
    minister_id,
    service_notes,
    adult_male_count,
    adult_female_count,
    children_count,
    new_members_male_count,
    new_members_female_count,
    new_converts_male_count,
    new_converts_female_count,
    submitted_by,
    submitted_at,
    updated_by,
    updated_at
  )
  values (
    service_uuid,
    p_service_date,
    p_minister_id,
    nullif(trim(coalesce(p_service_notes, '')), ''),
    p_adult_male_count,
    p_adult_female_count,
    p_children_count,
    p_new_members_male_count,
    p_new_members_female_count,
    p_new_converts_male_count,
    p_new_converts_female_count,
    actor_id,
    now(),
    actor_id,
    now()
  )
  returning id into attendance_uuid;

  return attendance_uuid;
end;
$$;

revoke all on function public.submit_church_attendance(
  date, text, integer, integer, integer, integer, integer, integer, integer,
  uuid, text
)
  from public;
grant execute on function public.submit_church_attendance(
  date, text, integer, integer, integer, integer, integer, integer, integer,
  uuid, text
)
  to authenticated;

-- Super admins may correct the minister or notes without creating a duplicate
-- attendance record or changing its service date.
create or replace function public.update_church_attendance_details(
  p_attendance_id uuid,
  p_minister_id uuid,
  p_service_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can update church attendance details';
  end if;

  if p_minister_id is null or not exists (
    select 1 from public.ministers as minister
    where minister.id = p_minister_id and minister.active = true
  ) then
    raise exception 'Select an active minister from the Minister Directory';
  end if;

  if char_length(trim(coalesce(p_service_notes, ''))) > 2000 then
    raise exception 'Service notes cannot exceed 2000 characters';
  end if;

  update public.church_attendance
  set minister_id = p_minister_id,
      service_notes = nullif(trim(coalesce(p_service_notes, '')), ''),
      updated_by = (select auth.uid()),
      updated_at = now()
  where id = p_attendance_id;

  if not found then
    raise exception 'Church attendance record was not found';
  end if;
end;
$$;

revoke all on function public.update_church_attendance_details(uuid, uuid, text)
  from public;
grant execute on function public.update_church_attendance_details(uuid, uuid, text)
  to authenticated;

-- Super admins may correct all aggregate counts as well as the minister and
-- notes. The service/date identity remains immutable.
create or replace function public.correct_church_attendance(
  p_attendance_id uuid,
  p_adult_male_count integer,
  p_adult_female_count integer,
  p_children_count integer,
  p_new_members_male_count integer,
  p_new_members_female_count integer,
  p_new_converts_male_count integer,
  p_new_converts_female_count integer,
  p_minister_id uuid,
  p_service_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can correct church attendance';
  end if;

  if p_minister_id is null or not exists (
    select 1 from public.ministers as minister
    where minister.id = p_minister_id and minister.active = true
  ) then
    raise exception 'Select an active minister from the Minister Directory';
  end if;

  if char_length(trim(coalesce(p_service_notes, ''))) > 2000 then
    raise exception 'Service notes cannot exceed 2000 characters';
  end if;

  if coalesce(p_adult_male_count, -1) < 0
     or coalesce(p_adult_female_count, -1) < 0
     or coalesce(p_children_count, -1) < 0
     or coalesce(p_new_members_male_count, -1) < 0
     or coalesce(p_new_members_female_count, -1) < 0
     or coalesce(p_new_converts_male_count, -1) < 0
     or coalesce(p_new_converts_female_count, -1) < 0
  then
    raise exception 'Attendance counts cannot be negative';
  end if;

  if p_new_members_male_count + p_new_converts_male_count > p_adult_male_count
     or p_new_members_female_count + p_new_converts_female_count > p_adult_female_count
  then
    raise exception 'New members and new converts must be distinct people included in the matching adult total';
  end if;

  update public.church_attendance
  set minister_id = p_minister_id,
      service_notes = nullif(trim(coalesce(p_service_notes, '')), ''),
      adult_male_count = p_adult_male_count,
      adult_female_count = p_adult_female_count,
      children_count = p_children_count,
      new_members_male_count = p_new_members_male_count,
      new_members_female_count = p_new_members_female_count,
      new_converts_male_count = p_new_converts_male_count,
      new_converts_female_count = p_new_converts_female_count,
      updated_by = (select auth.uid()),
      updated_at = now()
  where id = p_attendance_id;

  if not found then
    raise exception 'Church attendance record was not found';
  end if;
end;
$$;

revoke all on function public.correct_church_attendance(
  uuid, integer, integer, integer, integer, integer, integer, integer, uuid, text
) from public;
grant execute on function public.correct_church_attendance(
  uuid, integer, integer, integer, integer, integer, integer, integer, uuid, text
) to authenticated;

-- Correct one completed department submission without changing its service,
-- department, or historical roster. Updating changed log rows also invokes the
-- existing care-alert recalculation trigger for each affected worker.
create or replace function public.correct_department_attendance(
  p_submission_id uuid,
  p_present_worker_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  roster_total integer;
  present_total integer;
  invalid_present_count integer;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can correct submitted attendance';
  end if;

  if p_submission_id is null then
    raise exception 'Select an attendance submission';
  end if;

  select count(*)
    into roster_total
  from public.attendance_logs as log
  where log.submission_id = p_submission_id;

  if roster_total = 0 or not exists (
    select 1 from public.attendance_submissions as submission
    where submission.id = p_submission_id
  ) then
    raise exception 'Attendance submission was not found or has no worker records';
  end if;

  select count(*)
    into invalid_present_count
  from (
    select selected.id
    from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id)
    group by selected.id
  ) as selected
  left join public.attendance_logs as log
    on log.submission_id = p_submission_id
   and log.worker_id = selected.id
  where selected.id is null or log.id is null;

  if invalid_present_count > 0 then
    raise exception 'The present list contains a worker outside this submitted roster';
  end if;

  select count(distinct selected.id)
    into present_total
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id);

  update public.attendance_logs as log
  set status = case
        when log.worker_id = any(coalesce(p_present_worker_ids, array[]::uuid[]))
          then 'Present'
        else 'Absent'
      end
  where log.submission_id = p_submission_id
    and log.status is distinct from case
      when log.worker_id = any(coalesce(p_present_worker_ids, array[]::uuid[]))
        then 'Present'
      else 'Absent'
    end;

  update public.attendance_submissions
  set roster_count = roster_total,
      present_count = present_total,
      absent_count = roster_total - present_total,
      corrected_by = actor_id,
      corrected_at = now()
  where id = p_submission_id;
end;
$$;

revoke all on function public.correct_department_attendance(uuid, uuid[])
  from public;
grant execute on function public.correct_department_attendance(uuid, uuid[])
  to authenticated;

-- Create a dated draft by copying the current template rows as a snapshot.
create or replace function public.create_service_programme_from_template(
  p_template_id uuid,
  p_service_date date,
  p_service_type text,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  programme_uuid uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can create service programmes';
  end if;

  if p_service_date is null then
    raise exception 'Select a service date';
  end if;

  if p_service_type not in (
    'Sunday Service', 'Tuesday Service', 'Special Service',
    'Headquarters Service', 'Tarry Night'
  ) then
    raise exception 'Invalid service type';
  end if;

  if char_length(trim(coalesce(p_title, ''))) not between 3 and 160 then
    raise exception 'Enter a programme title';
  end if;

  if not exists (
    select 1 from public.service_programme_templates as template
    where template.id = p_template_id and template.active = true
  ) then
    raise exception 'Select an active programme template';
  end if;

  insert into public.service_programmes (
    template_id, service_date, service_type, title, created_by
  )
  values (
    p_template_id, p_service_date, p_service_type, trim(p_title),
    (select auth.uid())
  )
  returning id into programme_uuid;

  insert into public.service_programme_items (
    programme_id, position, start_time, end_time, event_name,
    responsible_name, duration_minutes, notes
  )
  select
    programme_uuid, item.position, item.start_time, item.end_time,
    item.event_name, item.responsible_name, item.duration_minutes, item.notes
  from public.service_programme_template_items as item
  where item.template_id = p_template_id
  order by item.position;

  return programme_uuid;
end;
$$;

revoke all on function public.create_service_programme_from_template(
  uuid, date, text, text
) from public;
grant execute on function public.create_service_programme_from_template(
  uuid, date, text, text
) to authenticated;

-- Trusted delivery workers atomically claim queued messages before contacting
-- Twilio. SKIP LOCKED prevents concurrent cron invocations from sending the
-- same care message twice.
create or replace function public.claim_queued_followup_events(
  p_limit integer default 25
)
returns setof public.followup_events
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    select event.id
    from public.followup_events as event
    where event.delivery_status = 'queued'
    order by event.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  update public.followup_events as event
  set delivery_status = 'processing',
      error_message = null
  from claimed
  where event.id = claimed.id
  returning event.*;
$$;

revoke all on function public.claim_queued_followup_events(integer)
  from public, anon, authenticated;
grant execute on function public.claim_queued_followup_events(integer)
  to service_role;

-- Trigger functions are invoked by PostgreSQL itself and do not need to be
-- callable through the API. Remove their default PUBLIC execute privilege.
revoke all on function public.handle_new_user() from public;
revoke all on function public.protect_profile_privileges() from public;
revoke all on function public.prepare_worker_messaging_preference() from public;
revoke all on function public.prepare_service() from public;
revoke all on function public.prepare_attendance_log() from public;
revoke all on function public.process_worker_absence() from public;
revoke all on function public.resolve_followup_for_unavailable_worker() from public;

-- Row-level security ---------------------------------------------------------

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.workers enable row level security;
alter table public.services enable row level security;
alter table public.attendance_submissions enable row level security;
alter table public.ministers enable row level security;
alter table public.church_attendance enable row level security;
alter table public.service_programme_templates enable row level security;
alter table public.service_programme_template_items enable row level security;
alter table public.service_programmes enable row level security;
alter table public.service_programme_items enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.absence_followups enable row level security;
alter table public.followup_events enable row level security;

-- Remove policies from the original draft and from earlier runs of this file.
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Leaders can view profiles" on public.profiles;
drop policy if exists "Super admins can manage profiles" on public.profiles;
drop policy if exists "Authenticated users can view departments" on public.departments;
drop policy if exists "Super admin can manage departments" on public.departments;
drop policy if exists "Dept heads view own dept workers" on public.workers;
drop policy if exists "Dept heads manage own dept workers" on public.workers;
drop policy if exists "Super admin manages all workers" on public.workers;
drop policy if exists "Authorized users can insert workers" on public.workers;
drop policy if exists "Authorized users can update workers" on public.workers;
drop policy if exists "Authorized users can delete workers" on public.workers;
drop policy if exists "Authenticated can view services" on public.services;
drop policy if exists "Dept heads can create services" on public.services;
drop policy if exists "Creators and leaders can update services" on public.services;
drop policy if exists "Creators and leaders can delete services" on public.services;
drop policy if exists "View authorized attendance submissions" on public.attendance_submissions;
drop policy if exists "Church leaders view ministers" on public.ministers;
drop policy if exists "Super admins manage ministers" on public.ministers;
drop policy if exists "Church leaders view church attendance" on public.church_attendance;
drop policy if exists "Super admins manage programme templates" on public.service_programme_templates;
drop policy if exists "Super admins manage programme template items" on public.service_programme_template_items;
drop policy if exists "Authorized users view programmes" on public.service_programmes;
drop policy if exists "Super admins manage programmes" on public.service_programmes;
drop policy if exists "Authorized users view programme items" on public.service_programme_items;
drop policy if exists "Super admins manage programme items" on public.service_programme_items;
drop policy if exists "Dept heads view own dept logs" on public.attendance_logs;
drop policy if exists "Dept heads submit attendance" on public.attendance_logs;
drop policy if exists "Authorized users can update attendance" on public.attendance_logs;
drop policy if exists "Authorized users can delete attendance" on public.attendance_logs;
drop policy if exists "View own dept followups" on public.absence_followups;
drop policy if exists "Dept heads update followups" on public.absence_followups;
drop policy if exists "Authorized users can create followups" on public.absence_followups;
drop policy if exists "Authorized users can update followups" on public.absence_followups;
drop policy if exists "View authorized followup events" on public.followup_events;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Leaders can view profiles"
  on public.profiles for select to authenticated
  using (public.is_church_leader());

create policy "Super admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Authenticated users can view departments"
  on public.departments for select to authenticated
  using (true);

create policy "Super admin can manage departments"
  on public.departments for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Dept heads view own dept workers"
  on public.workers for select to authenticated
  using (
    public.is_church_leader()
    or department_id = public.current_department_id()
  );

create policy "Authorized users can insert workers"
  on public.workers for insert to authenticated
  with check (public.is_super_admin());

create policy "Authorized users can update workers"
  on public.workers for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Authorized users can delete workers"
  on public.workers for delete to authenticated
  using (public.is_super_admin());

create policy "Authenticated can view services"
  on public.services for select to authenticated
  using (true);

create policy "Dept heads can create services"
  on public.services for insert to authenticated
  with check (
    public.is_super_admin()
    and created_by = (select auth.uid())
  );

create policy "Creators and leaders can update services"
  on public.services for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Creators and leaders can delete services"
  on public.services for delete to authenticated
  using (public.is_super_admin());

create policy "View authorized attendance submissions"
  on public.attendance_submissions for select to authenticated
  using (
    public.is_church_leader()
    or department_id = public.current_department_id()
  );

create policy "Church leaders view ministers"
  on public.ministers for select to authenticated
  using (public.is_church_leader());

create policy "Super admins manage ministers"
  on public.ministers for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Church leaders view church attendance"
  on public.church_attendance for select to authenticated
  using (public.is_church_leader());

create policy "Super admins manage programme templates"
  on public.service_programme_templates for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins manage programme template items"
  on public.service_programme_template_items for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Authorized users view programmes"
  on public.service_programmes for select to authenticated
  using (
    public.is_super_admin()
    or (
      status = 'published'
      and public.current_profile_role() in ('church_leader', 'department_head')
    )
  );

create policy "Super admins manage programmes"
  on public.service_programmes for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Authorized users view programme items"
  on public.service_programme_items for select to authenticated
  using (
    exists (
      select 1 from public.service_programmes as programme
      where programme.id = service_programme_items.programme_id
        and (
          public.is_super_admin()
          or (
            programme.status = 'published'
            and public.current_profile_role() in ('church_leader', 'department_head')
          )
        )
    )
  );

create policy "Super admins manage programme items"
  on public.service_programme_items for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Dept heads view own dept logs"
  on public.attendance_logs for select to authenticated
  using (
    public.is_church_leader()
    or department_id = public.current_department_id()
  );

create policy "Dept heads submit attendance"
  on public.attendance_logs for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and (
      public.is_super_admin()
      or (
        public.current_profile_role() = 'department_head'
        and department_id = public.current_department_id()
      )
    )
  );

create policy "Authorized users can update attendance"
  on public.attendance_logs for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and department_id = public.current_department_id()
    )
  )
  with check (
    submitted_by = (select auth.uid())
    and (
      public.is_super_admin()
      or (
        public.current_profile_role() = 'department_head'
        and department_id = public.current_department_id()
      )
    )
  );

create policy "Authorized users can delete attendance"
  on public.attendance_logs for delete to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and department_id = public.current_department_id()
    )
  );

create policy "View own dept followups"
  on public.absence_followups for select to authenticated
  using (
    public.is_church_leader()
    or exists (
      select 1
      from public.workers as w
      where w.id = worker_id
        and w.department_id = public.current_department_id()
    )
  );

create policy "Authorized users can create followups"
  on public.absence_followups for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and exists (
        select 1
        from public.workers as w
        where w.id = worker_id
          and w.department_id = public.current_department_id()
      )
    )
  );

create policy "Authorized users can update followups"
  on public.absence_followups for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and exists (
        select 1
        from public.workers as w
        where w.id = worker_id
          and w.department_id = public.current_department_id()
      )
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and exists (
        select 1
        from public.workers as w
        where w.id = worker_id
          and w.department_id = public.current_department_id()
      )
    )
  );

create policy "View authorized followup events"
  on public.followup_events for select to authenticated
  using (
    public.is_church_leader()
    or exists (
      select 1
      from public.workers as w
      where w.id = worker_id
        and w.department_id = public.current_department_id()
    )
  );

-- Explicit API privileges. RLS still decides which rows are accessible.
revoke all on table public.departments from anon;
revoke all on table public.profiles from anon;
revoke all on table public.workers from anon;
revoke all on table public.services from anon;
revoke all on table public.attendance_submissions from anon;
revoke all on table public.ministers from anon;
revoke all on table public.church_attendance from anon;
revoke all on table public.service_programme_templates from anon;
revoke all on table public.service_programme_template_items from anon;
revoke all on table public.service_programmes from anon;
revoke all on table public.service_programme_items from anon;
revoke all on table public.attendance_logs from anon;
revoke all on table public.absence_followups from anon;
revoke all on table public.followup_events from anon;

grant select, insert, update, delete on table public.departments to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workers to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select on table public.attendance_submissions to authenticated;
grant select, insert, update on table public.ministers to authenticated;
grant select on table public.church_attendance to authenticated;
grant select, insert, update, delete on table public.service_programme_templates to authenticated;
grant select, insert, update, delete on table public.service_programme_template_items to authenticated;
grant select, insert, update, delete on table public.service_programmes to authenticated;
grant select, insert, update, delete on table public.service_programme_items to authenticated;
grant select on table public.attendance_logs to authenticated;
grant select, update on table public.absence_followups to authenticated;
grant select on table public.followup_events to authenticated;

-- Idempotent seed data -------------------------------------------------------

insert into public.departments (name) values
  ('Ushering'),
  ('Sanctuary'),
  ('Media'),
  ('Children'),
  ('Protocol'),
  ('Music'),
  ('Technical'),
  ('Enumerator')
on conflict (name) do nothing;

-- Initial reusable template transcribed from the supplied Sunday programme.
insert into public.service_programme_templates (id, name, active)
values (
  '00000000-0000-4000-8000-000000000101',
  'Celebrate Jesus Service - Standard Sunday Schedule',
  true
)
on conflict (id) do nothing;

insert into public.service_programme_template_items (
  template_id, position, start_time, end_time, event_name,
  responsible_name, duration_minutes
)
values
  ('00000000-0000-4000-8000-000000000101', 1, '07:50', '08:30', 'Leadership Half Hour', 'Pastor Tonia Ezenwa', 40),
  ('00000000-0000-4000-8000-000000000101', 2, '08:30', '08:40', 'Intercessory Prayer', 'Brother Obinna Onuoha', 10),
  ('00000000-0000-4000-8000-000000000101', 3, '08:40', '08:55', 'Praise Session', 'New Covenant Voices', 15),
  ('00000000-0000-4000-8000-000000000101', 4, '08:55', '09:00', 'Hannah''s Time', 'Deaconess Nnenna Igwe', 5),
  ('00000000-0000-4000-8000-000000000101', 5, '09:00', '09:10', 'Choir Ministration', 'New Covenant Voices', 10),
  ('00000000-0000-4000-8000-000000000101', 6, '09:10', '09:15', 'Edify Yourself', 'Pastor Peace', 5),
  ('00000000-0000-4000-8000-000000000101', 7, '09:15', '09:20', 'Worship', 'New Covenant Voices', 5),
  ('00000000-0000-4000-8000-000000000101', 8, '09:20', '09:30', 'Preamble', 'Pastor Joshua King', 10),
  ('00000000-0000-4000-8000-000000000101', 9, '09:30', '10:10', 'Word', 'Brother Seth Chidi', 40),
  ('00000000-0000-4000-8000-000000000101', 10, '10:10', '10:20', 'Tithes and Offering', 'Brother Seth Chidi', 10),
  ('00000000-0000-4000-8000-000000000101', 11, '10:20', '10:25', 'Transport Offering', 'Pastor Tonia Ezenwa', 5),
  ('00000000-0000-4000-8000-000000000101', 12, '10:25', '10:30', 'Godson and Crew', 'Media', 5),
  ('00000000-0000-4000-8000-000000000101', 13, '10:30', '10:35', 'Welcome of First Timers', 'VIP', 5),
  ('00000000-0000-4000-8000-000000000101', 14, '10:35', '10:40', 'Announcements', 'Media', 5),
  ('00000000-0000-4000-8000-000000000101', 15, '10:40', '10:45', 'Benediction', 'Reverend Kingsley Nkwuocha', 5)
on conflict (template_id, position) do nothing;

-- Bootstrap step:
-- 1. Sign up the first administrator through Supabase Auth.
-- 2. Find that user in Authentication > Users.
-- 3. Run the following once, replacing the UUID:
--
-- update public.profiles
-- set role = 'super_admin'
-- where id = 'YOUR-AUTH-USER-UUID';
--
-- Or promote the first administrator directly by email:
--
-- update public.profiles as p
-- set role = 'super_admin',
--     department_id = null
-- from auth.users as u
-- where p.id = u.id
--   and lower(u.email) = lower('YOUR-ADMIN-EMAIL');
