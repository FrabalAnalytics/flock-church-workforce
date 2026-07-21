-- Service-day scheduling, submission monitoring and operational audit history.

alter table public.services
  add column if not exists attendance_status text not null default 'open';
alter table public.services
  add column if not exists attendance_managed boolean not null default false;
alter table public.services
  add column if not exists attendance_closed_at timestamptz;
alter table public.services
  add column if not exists attendance_closed_by uuid
  references public.profiles(id) on delete set null;

alter table public.services
  drop constraint if exists services_attendance_status_check;
alter table public.services
  add constraint services_attendance_status_check
  check (attendance_status in ('open', 'closed'));

alter table public.services
  drop constraint if exists services_attendance_closure_state;
alter table public.services
  add constraint services_attendance_closure_state
  check (
    (attendance_status = 'open' and attendance_closed_at is null
      and attendance_closed_by is null)
    or (attendance_status = 'closed' and attendance_closed_at is not null)
  );

create table if not exists public.service_department_expectations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  reminder_count integer not null default 0 check (reminder_count >= 0),
  last_reminded_at timestamptz,
  last_reminded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (service_id, department_id)
);

create table if not exists public.service_control_events (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in (
    'scheduled', 'reminder_recorded', 'attendance_closed', 'attendance_reopened'
  )),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists service_expectations_service_id_idx
  on public.service_department_expectations (service_id);
create index if not exists service_expectations_department_id_idx
  on public.service_department_expectations (department_id);
create index if not exists service_control_events_service_id_idx
  on public.service_control_events (service_id, created_at desc);
create index if not exists services_date_status_idx
  on public.services (service_date, attendance_status);

alter table public.service_department_expectations enable row level security;
alter table public.service_control_events enable row level security;

create policy "Authorized users view service expectations"
  on public.service_department_expectations for select to authenticated
  using (
    public.is_church_leader()
    or department_id = public.current_department_id()
  );

create policy "Super admins manage service expectations"
  on public.service_department_expectations for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Leaders view service control events"
  on public.service_control_events for select to authenticated
  using (public.is_church_leader());

revoke all on table public.service_department_expectations from anon;
revoke all on table public.service_control_events from anon;
grant select, insert, update, delete on table public.service_department_expectations
  to authenticated;
grant select on table public.service_control_events to authenticated;

create or replace function public.schedule_service_day(
  p_service_date date,
  p_service_type text,
  p_department_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  service_uuid uuid;
  selected_count integer;
  valid_count integer;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can schedule a service day';
  end if;

  if p_service_date is null
     or p_service_date < (now() at time zone 'Africa/Lagos')::date - 30
     or p_service_date > (now() at time zone 'Africa/Lagos')::date + 365
  then
    raise exception 'Choose a service date from the last 30 days through the next year';
  end if;

  if p_service_type not in (
    'Sunday Service', 'Tuesday Service', 'Special Service',
    'Headquarters Service', 'Tarry Night'
  ) then
    raise exception 'Invalid service type';
  end if;

  select count(distinct selected.id)
    into selected_count
  from unnest(coalesce(p_department_ids, array[]::uuid[])) as selected(id);

  select count(*)
    into valid_count
  from public.departments
  where id = any(coalesce(p_department_ids, array[]::uuid[]));

  if selected_count = 0 or selected_count <> valid_count then
    raise exception 'Select at least one valid department';
  end if;

  insert into public.services (service_date, service_type, created_by)
  values (p_service_date, p_service_type, actor_id)
  on conflict (service_date, service_type)
  do update set service_date = excluded.service_date
  returning id into service_uuid;

  if exists (
    select 1 from public.attendance_submissions
    where service_id = service_uuid
      and not (department_id = any(p_department_ids))
  ) then
    raise exception 'A department with a submitted register cannot be removed from the schedule';
  end if;

  update public.services
  set attendance_managed = true
  where id = service_uuid;

  insert into public.service_department_expectations (service_id, department_id)
  select service_uuid, selected.id
  from (
    select distinct id
    from unnest(p_department_ids) as chosen(id)
  ) as selected
  on conflict (service_id, department_id) do nothing;

  delete from public.service_department_expectations
  where service_id = service_uuid
    and not (department_id = any(p_department_ids));

  insert into public.service_control_events (
    service_id, actor_id, event_type, detail
  ) values (
    service_uuid,
    actor_id,
    'scheduled',
    format('%s department(s) expected', selected_count)
  );

  return service_uuid;
end;
$$;

create or replace function public.set_service_attendance_status(
  p_service_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  old_status text;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can close or reopen attendance';
  end if;

  if p_status not in ('open', 'closed') then
    raise exception 'Invalid attendance status';
  end if;

  select attendance_status into old_status
  from public.services
  where id = p_service_id
  for update;

  if old_status is null then
    raise exception 'Service not found';
  end if;

  if old_status = p_status then
    return;
  end if;

  update public.services
  set attendance_status = p_status,
      attendance_closed_at = case when p_status = 'closed' then now() else null end,
      attendance_closed_by = case when p_status = 'closed' then actor_id else null end
  where id = p_service_id;

  insert into public.service_control_events (
    service_id, actor_id, event_type
  ) values (
    p_service_id,
    actor_id,
    case when p_status = 'closed'
      then 'attendance_closed'
      else 'attendance_reopened'
    end
  );
end;
$$;

create or replace function public.record_service_reminder(
  p_service_id uuid,
  p_department_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  affected_count integer;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can record service reminders';
  end if;

  update public.service_department_expectations as expectation
  set reminder_count = expectation.reminder_count + 1,
      last_reminded_at = now(),
      last_reminded_by = actor_id
  where expectation.service_id = p_service_id
    and expectation.department_id = p_department_id
    and not exists (
      select 1 from public.attendance_submissions as submission
      where submission.service_id = p_service_id
        and submission.department_id = p_department_id
    );

  get diagnostics affected_count = row_count;
  if affected_count = 0 then
    raise exception 'This department is not pending attendance';
  end if;

  insert into public.service_control_events (
    service_id, department_id, actor_id, event_type
  ) values (
    p_service_id, p_department_id, actor_id, 'reminder_recorded'
  );
end;
$$;

revoke all on function public.schedule_service_day(date, text, uuid[]) from public;
revoke all on function public.set_service_attendance_status(uuid, text) from public;
revoke all on function public.record_service_reminder(uuid, uuid) from public;
grant execute on function public.schedule_service_day(date, text, uuid[])
  to authenticated;
grant execute on function public.set_service_attendance_status(uuid, text)
  to authenticated;
grant execute on function public.record_service_reminder(uuid, uuid)
  to authenticated;

-- Scheduled service days enforce their expected roster and closure state.
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
  service_attendance_status text;
  service_attendance_managed boolean;
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
    'Sunday Service', 'Tuesday Service', 'Special Service',
    'Headquarters Service', 'Tarry Night'
  ) then
    raise exception 'Invalid service type';
  end if;

  select count(*) into invalid_present_count
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
  returning id, attendance_status, attendance_managed
    into service_uuid, service_attendance_status, service_attendance_managed;

  if service_attendance_status = 'closed' then
    raise exception 'Attendance for this service has been closed';
  end if;

  if service_attendance_managed and not exists (
    select 1 from public.service_department_expectations
    where service_id = service_uuid
      and department_id = actor_department_id
  ) then
    raise exception 'Your department is not expected for this scheduled service';
  end if;

  select count(*) into active_count
  from public.workers
  where department_id = actor_department_id and status = 'Active';

  select count(distinct selected.id) into present_total
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id);

  insert into public.attendance_submissions (
    service_id, department_id, submitted_by,
    roster_count, present_count, absent_count, submitted_at
  ) values (
    service_uuid, actor_department_id, actor_id,
    active_count, present_total, active_count - present_total, now()
  )
  on conflict (service_id, department_id)
  do update set
    submitted_by = excluded.submitted_by,
    roster_count = excluded.roster_count,
    present_count = excluded.present_count,
    absent_count = excluded.absent_count,
    submitted_at = excluded.submitted_at
  returning id into submission_uuid;

  insert into public.attendance_logs (
    submission_id, service_id, worker_id, department_id,
    status, submitted_by, created_at
  )
  select
    submission_uuid, service_uuid, w.id, actor_department_id,
    case when w.id = any(coalesce(p_present_worker_ids, array[]::uuid[]))
      then 'Present' else 'Absent' end,
    actor_id, now()
  from public.workers as w
  where w.department_id = actor_department_id and w.status = 'Active'
  on conflict (service_id, worker_id)
  do update set
    submission_id = excluded.submission_id,
    status = excluded.status,
    submitted_by = excluded.submitted_by,
    created_at = excluded.created_at;

  return submission_uuid;
end;
$$;
