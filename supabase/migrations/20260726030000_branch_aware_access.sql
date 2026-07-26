-- Branch-aware access control and write-path updates.
--
-- This migration keeps HQ behavior intact while making the database enforce
-- church/branch scope for operational reads and new writes.

create or replace function public.record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  record_id uuid;
  current_actor_id uuid := (select auth.uid());
  current_actor_name text := 'System';
  current_church_id uuid := coalesce(public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  current_branch_id uuid := coalesce(public.current_branch_id(), '00000000-0000-4000-8000-000000000202');
begin
  if tg_op = 'INSERT' then
    new_data := to_jsonb(new);
    record_id := (new_data ->> 'id')::uuid;
  elsif tg_op = 'UPDATE' then
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
    if old_data = new_data then
      return new;
    end if;
    record_id := (new_data ->> 'id')::uuid;
  else
    old_data := to_jsonb(old);
    record_id := (old_data ->> 'id')::uuid;
  end if;

  if current_actor_id is not null then
    select coalesce(nullif(trim(profile.full_name), ''), 'Authenticated user')
      into current_actor_name
    from public.profiles as profile
    where profile.id = current_actor_id;
    if not found then
      current_actor_id := null;
      current_actor_name := 'Authenticated user';
    else
      current_actor_name := coalesce(current_actor_name, 'Authenticated user');
    end if;
  end if;

  insert into public.audit_events (
    entity_table, entity_id, action, actor_id, actor_name,
    before_data, after_data, church_id, branch_id
  ) values (
    tg_table_name,
    record_id,
    case tg_op
      when 'INSERT' then 'inserted'
      when 'UPDATE' then 'updated'
      else 'deleted'
    end,
    current_actor_id,
    current_actor_name,
    old_data,
    new_data,
    current_church_id,
    current_branch_id
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prepare_first_timer_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.full_name := trim(new.full_name);
  new.phone_number := trim(new.phone_number);
  new.phone_number_normalized := regexp_replace(new.phone_number, '[^0-9]', '', 'g');
  new.email := nullif(lower(trim(coalesce(new.email, ''))), '');
  new.updated_at := now();
  new.church_id := coalesce(new.church_id, public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  new.branch_id := coalesce(new.branch_id, public.current_branch_id(), '00000000-0000-4000-8000-000000000202');

  if (select auth.uid()) is not null and tg_op = 'INSERT' then
    new.registered_by := (select auth.uid());
  end if;

  if new.consent_to_contact then
    new.consent_recorded_at := coalesce(new.consent_recorded_at, now());
  else
    new.consent_recorded_at := null;
    new.preferred_contact := 'none';
    new.next_followup_at := null;
  end if;

  return new;
end;
$$;

create or replace function public.prepare_first_timer_child_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_first_timer record;
begin
  select ft.church_id, ft.branch_id
    into parent_first_timer
  from public.first_timers as ft
  where ft.id = new.first_timer_id;

  if tg_table_name = 'first_timer_interactions' then
    new.created_by := coalesce((select auth.uid()), new.created_by);
  else
    new.recorded_by := coalesce((select auth.uid()), new.recorded_by);
  end if;

  new.church_id := coalesce(new.church_id, parent_first_timer.church_id, public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  new.branch_id := coalesce(new.branch_id, parent_first_timer.branch_id, public.current_branch_id(), '00000000-0000-4000-8000-000000000202');
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone_number, role, church_id, branch_id)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New user'
    ),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone_number'), ''),
    'pending',
    coalesce(public.current_church_id(), '00000000-0000-4000-8000-000000000201'),
    coalesce(public.current_branch_id(), '00000000-0000-4000-8000-000000000202')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

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
  current_church_id uuid := coalesce(public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  current_branch_id uuid := coalesce(public.current_branch_id(), '00000000-0000-4000-8000-000000000202');
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
  where id = any(coalesce(p_department_ids, array[]::uuid[]))
    and branch_id = current_branch_id;

  if selected_count = 0 or selected_count <> valid_count then
    raise exception 'Select at least one valid department';
  end if;

  insert into public.services (church_id, branch_id, service_date, service_type, created_by)
  values (current_church_id, current_branch_id, p_service_date, p_service_type, actor_id)
  on conflict (branch_id, service_date, service_type)
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

  insert into public.service_department_expectations (
    church_id, branch_id, service_id, department_id
  )
  select
    current_church_id,
    current_branch_id,
    service_uuid,
    selected.id
  from (
    select distinct id
    from unnest(p_department_ids) as chosen(id)
  ) as selected
  on conflict (service_id, department_id) do nothing;

  delete from public.service_department_expectations
  where service_id = service_uuid
    and not (department_id = any(p_department_ids));

  insert into public.service_control_events (
    church_id, branch_id, service_id, actor_id, event_type, detail
  ) values (
    current_church_id,
    current_branch_id,
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
  service_row record;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can close or reopen attendance';
  end if;

  if p_status not in ('open', 'closed') then
    raise exception 'Invalid attendance status';
  end if;

  select id, church_id, branch_id, attendance_status
    into service_row
  from public.services
  where id = p_service_id
  for update;

  old_status := service_row.attendance_status;
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
    church_id, branch_id, service_id, actor_id, event_type
  ) values (
    service_row.church_id,
    service_row.branch_id,
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
  service_row record;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can record service reminders';
  end if;

  select church_id, branch_id
    into service_row
  from public.services
  where id = p_service_id;

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
    church_id, branch_id, service_id, department_id, actor_id, event_type
  ) values (
    service_row.church_id,
    service_row.branch_id,
    p_service_id,
    p_department_id,
    actor_id,
    'reminder_recorded'
  );
end;
$$;

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
  current_church_id uuid := coalesce(public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  current_branch_id uuid := coalesce(public.current_branch_id(), '00000000-0000-4000-8000-000000000202');
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

  select count(*)
    into invalid_present_count
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id)
  left join public.workers as w on w.id = selected.id
  where w.id is null
     or w.department_id <> actor_department_id
     or w.status <> 'Active'
     or w.branch_id <> current_branch_id;

  if invalid_present_count > 0 then
    raise exception 'The present list contains a worker outside your active department roster';
  end if;

  insert into public.services (
    church_id, branch_id, service_date, service_type, created_by
  )
  values (current_church_id, current_branch_id, service_day, p_service_type, actor_id)
  on conflict (branch_id, service_date, service_type)
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

  select count(*)
    into active_count
  from public.workers
  where department_id = actor_department_id
    and status = 'Active'
    and branch_id = current_branch_id;

  select count(distinct selected.id)
    into present_total
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id);

  insert into public.attendance_submissions (
    church_id, branch_id, service_id, department_id, submitted_by,
    roster_count, present_count, absent_count, submitted_at
  ) values (
    current_church_id,
    current_branch_id,
    service_uuid,
    actor_department_id,
    actor_id,
    active_count,
    present_total,
    active_count - present_total,
    now()
  )
  on conflict (service_id, department_id)
  do update set
    church_id = excluded.church_id,
    branch_id = excluded.branch_id,
    submitted_by = excluded.submitted_by,
    roster_count = excluded.roster_count,
    present_count = excluded.present_count,
    absent_count = excluded.absent_count,
    submitted_at = excluded.submitted_at
  returning id into submission_uuid;

  insert into public.attendance_logs (
    church_id, branch_id, submission_id, service_id, worker_id, department_id,
    status, submitted_by, created_at
  )
  select
    current_church_id,
    current_branch_id,
    submission_uuid,
    service_uuid,
    w.id,
    actor_department_id,
    case when w.id = any(coalesce(p_present_worker_ids, array[]::uuid[]))
      then 'Present' else 'Absent' end,
    actor_id,
    now()
  from public.workers as w
  where w.department_id = actor_department_id
    and w.status = 'Active'
    and w.branch_id = current_branch_id
  on conflict (service_id, worker_id)
  do update set
    church_id = excluded.church_id,
    branch_id = excluded.branch_id,
    submission_id = excluded.submission_id,
    status = excluded.status,
    submitted_by = excluded.submitted_by,
    created_at = excluded.created_at;

  return submission_uuid;
end;
$$;

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
  current_church_id uuid := coalesce(public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  current_branch_id uuid := coalesce(public.current_branch_id(), '00000000-0000-4000-8000-000000000202');
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can record church attendance';
  end if;

  if p_minister_id is null or not exists (
    select 1 from public.ministers as minister
    where minister.id = p_minister_id and minister.active = true
      and minister.church_id = current_church_id
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
      and attendance.branch_id = current_branch_id
  ) then
    raise exception 'Church attendance has already been recorded for this date';
  end if;

  insert into public.services (
    church_id, branch_id, service_date, service_type, created_by
  )
  values (current_church_id, current_branch_id, p_service_date, p_service_type, actor_id)
  on conflict (branch_id, service_date, service_type)
  do update set service_date = excluded.service_date
  returning id into service_uuid;

  insert into public.church_attendance (
    church_id, branch_id, service_id, attendance_date, minister_id, service_notes,
    adult_male_count, adult_female_count, children_count, new_members_male_count,
    new_members_female_count, new_converts_male_count, new_converts_female_count,
    submitted_by, submitted_at, updated_by, updated_at
  )
  values (
    current_church_id,
    current_branch_id,
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
  template_row record;
  current_church_id uuid := coalesce(public.current_church_id(), '00000000-0000-4000-8000-000000000201');
  current_branch_id uuid := coalesce(public.current_branch_id(), '00000000-0000-4000-8000-000000000202');
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

  select template.church_id, template.branch_id
    into template_row
  from public.service_programme_templates as template
  where template.id = p_template_id and template.active = true;

  if not found then
    raise exception 'Select an active programme template';
  end if;

  insert into public.service_programmes (
    church_id, branch_id, template_id, service_date, service_type, title, created_by
  )
  values (
    coalesce(template_row.church_id, current_church_id),
    coalesce(template_row.branch_id, current_branch_id),
    p_template_id, p_service_date, p_service_type, trim(p_title),
    (select auth.uid())
  )
  returning id into programme_uuid;

  insert into public.service_programme_items (
    church_id, branch_id, programme_id, position, start_time, end_time,
    event_name, responsible_name, duration_minutes, notes
  )
  select
    coalesce(template_row.church_id, current_church_id),
    coalesce(template_row.branch_id, current_branch_id),
    programme_uuid,
    item.position, item.start_time, item.end_time,
    item.event_name, item.responsible_name, item.duration_minutes, item.notes
  from public.service_programme_template_items as item
  where item.template_id = p_template_id
  order by item.position;

  return programme_uuid;
end;
$$;

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
  worker_row record;
begin
  select w.full_name, w.whatsapp_opt_in, w.church_id, w.branch_id, d.name as department_name
    into worker_row
  from public.workers as w
  join public.departments as d on d.id = w.department_id
  where w.id = new.worker_id;

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
    church_id,
    branch_id,
    worker_id,
    service_id,
    consecutive_misses,
    resolved,
    resolved_at
  )
  values (
    worker_row.church_id,
    worker_row.branch_id,
    new.worker_id,
    latest_absent_service_id,
    miss_total,
    false,
    null
  )
  on conflict (worker_id) where resolved = false
  do update set
    church_id = excluded.church_id,
    branch_id = excluded.branch_id,
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
          'Hi %s, we missed you at %s today and wanted to check that you''re doing well. We hope to see you soon. â€” TREM %s',
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
          'Hi %s, we have missed you at several services and wanted to reach out personally. Please let your %s leader know how you are doing. You are important to us. â€” TREM',
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
      church_id,
      branch_id,
      followup_id,
      worker_id,
      service_id,
      miss_count,
      event_type,
      message_body,
      delivery_status
    )
    values (
      worker_row.church_id,
      worker_row.branch_id,
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

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Leaders can view profiles" on public.profiles;
drop policy if exists "First timer team can view coordinators" on public.profiles;
drop policy if exists "Super admins can manage profiles" on public.profiles;
drop policy if exists "Authenticated users can view departments" on public.departments;
drop policy if exists "Super admin can manage departments" on public.departments;
drop policy if exists "Dept heads view own dept workers" on public.workers;
drop policy if exists "Authorized users can insert workers" on public.workers;
drop policy if exists "Authorized users can update workers" on public.workers;
drop policy if exists "Authorized users can delete workers" on public.workers;
drop policy if exists "Authenticated can view services" on public.services;
drop policy if exists "Dept heads can create services" on public.services;
drop policy if exists "Creators and leaders can update services" on public.services;
drop policy if exists "Creators and leaders can delete services" on public.services;
drop policy if exists "View authorized attendance submissions" on public.attendance_submissions;
drop policy if exists "Authorized users view service expectations" on public.service_department_expectations;
drop policy if exists "Super admins manage service expectations" on public.service_department_expectations;
drop policy if exists "Leaders view service control events" on public.service_control_events;
drop policy if exists "Super admins view audit events" on public.audit_events;
drop policy if exists "Super admins manage church settings" on public.church_settings;
drop policy if exists "Super admins view system job runs" on public.system_job_runs;
drop policy if exists "Users manage own notification state" on public.notification_states;
drop policy if exists "Church leaders view ministers" on public.ministers;
drop policy if exists "Super admins manage ministers" on public.ministers;
drop policy if exists "Church leaders view church attendance" on public.church_attendance;
drop policy if exists "Super admins manage programme templates" on public.service_programme_templates;
drop policy if exists "Super admins manage programme template items" on public.service_programme_template_items;
drop policy if exists "Authorized users view programmes" on public.service_programmes;
drop policy if exists "Super admins manage programmes" on public.service_programmes;
drop policy if exists "Authorized users view programme items" on public.service_programme_items;
drop policy if exists "Super admins manage programme items" on public.service_programme_items;
drop policy if exists "Super admins manage programme shares" on public.service_programme_shares;
drop policy if exists "Dept heads view own dept logs" on public.attendance_logs;
drop policy if exists "Dept heads submit attendance" on public.attendance_logs;
drop policy if exists "Authorized users can update attendance" on public.attendance_logs;
drop policy if exists "Authorized users can delete attendance" on public.attendance_logs;
drop policy if exists "View own dept followups" on public.absence_followups;
drop policy if exists "Authorized users can create followups" on public.absence_followups;
drop policy if exists "Authorized users can update followups" on public.absence_followups;
drop policy if exists "View authorized followup events" on public.followup_events;
drop policy if exists "First timer managers view people" on public.first_timers;
drop policy if exists "First timer managers create people" on public.first_timers;
drop policy if exists "First timer managers update people" on public.first_timers;
drop policy if exists "Super admins delete first timers" on public.first_timers;
drop policy if exists "First timer managers view interactions" on public.first_timer_interactions;
drop policy if exists "First timer managers create interactions" on public.first_timer_interactions;
drop policy if exists "Super admins delete first timer interactions" on public.first_timer_interactions;
drop policy if exists "First timer managers view visits" on public.first_timer_visits;
drop policy if exists "First timer managers create visits" on public.first_timer_visits;
drop policy if exists "Super admins delete first timer visits" on public.first_timer_visits;
drop policy if exists "First timer managers view stage history" on public.first_timer_stage_history;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Leaders can view profiles"
  on public.profiles for select to authenticated
  using (public.is_church_leader());

create policy "First timer team can view coordinators"
  on public.profiles for select to authenticated
  using (
    public.current_profile_role() = 'first_timer_coordinator'
    and branch_id = public.current_branch_id()
  );

create policy "Super admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Authenticated users can view departments"
  on public.departments for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

create policy "Super admin can manage departments"
  on public.departments for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Dept heads view own dept workers"
  on public.workers for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
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
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

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
    or branch_id = public.current_branch_id()
  );

create policy "Authorized users view service expectations"
  on public.service_department_expectations for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

create policy "Super admins manage service expectations"
  on public.service_department_expectations for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Leaders view service control events"
  on public.service_control_events for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

create policy "Super admins view audit events"
  on public.audit_events for select to authenticated
  using (public.is_super_admin());

create policy "Super admins manage church settings"
  on public.church_settings for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins view system job runs"
  on public.system_job_runs for select to authenticated
  using (public.is_super_admin());

create policy "Users manage own notification state"
  on public.notification_states for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

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
    public.is_church_leader()
    or (
      status = 'published'
      and branch_id = public.current_branch_id()
      and public.current_profile_role() in ('department_head', 'first_timer_coordinator')
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
          public.is_church_leader()
          or (
            programme.status = 'published'
            and programme.branch_id = public.current_branch_id()
            and public.current_profile_role() in ('department_head', 'first_timer_coordinator')
          )
        )
    )
  );

create policy "Super admins manage programme items"
  on public.service_programme_items for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins manage programme shares"
  on public.service_programme_shares for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Dept heads view own dept logs"
  on public.attendance_logs for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

create policy "Dept heads submit attendance"
  on public.attendance_logs for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and (
      public.is_super_admin()
      or (
        public.current_profile_role() = 'department_head'
        and branch_id = public.current_branch_id()
      )
    )
  );

create policy "Authorized users can update attendance"
  on public.attendance_logs for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and branch_id = public.current_branch_id()
    )
  )
  with check (
    submitted_by = (select auth.uid())
    and (
      public.is_super_admin()
      or (
        public.current_profile_role() = 'department_head'
        and branch_id = public.current_branch_id()
      )
    )
  );

create policy "Authorized users can delete attendance"
  on public.attendance_logs for delete to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and branch_id = public.current_branch_id()
    )
  );

create policy "View own dept followups"
  on public.absence_followups for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

create policy "Authorized users can create followups"
  on public.absence_followups for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and branch_id = public.current_branch_id()
    )
  );

create policy "Authorized users can update followups"
  on public.absence_followups for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and branch_id = public.current_branch_id()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.current_profile_role() = 'department_head'
      and branch_id = public.current_branch_id()
    )
  );

create policy "View authorized followup events"
  on public.followup_events for select to authenticated
  using (
    public.is_church_leader()
    or branch_id = public.current_branch_id()
  );

create policy "First timer managers view people"
  on public.first_timers for select to authenticated
  using (
    public.is_church_leader()
    or (
      public.current_profile_role() = 'first_timer_coordinator'
      and branch_id = public.current_branch_id()
    )
  );

create policy "First timer managers create people"
  on public.first_timers for insert to authenticated
  with check (
    public.is_first_timer_manager()
    and registered_by = (select auth.uid())
    and (
      public.is_church_leader()
      or branch_id = public.current_branch_id()
    )
  );

create policy "First timer managers update people"
  on public.first_timers for update to authenticated
  using (
    public.is_church_leader()
    or (
      public.current_profile_role() = 'first_timer_coordinator'
      and branch_id = public.current_branch_id()
    )
  )
  with check (
    public.is_church_leader()
    or (
      public.current_profile_role() = 'first_timer_coordinator'
      and branch_id = public.current_branch_id()
    )
  );

create policy "Super admins delete first timers"
  on public.first_timers for delete to authenticated
  using (public.is_super_admin());

create policy "First timer managers view interactions"
  on public.first_timer_interactions for select to authenticated
  using (
    public.is_church_leader()
    or (
      public.current_profile_role() = 'first_timer_coordinator'
      and branch_id = public.current_branch_id()
    )
  );

create policy "First timer managers create interactions"
  on public.first_timer_interactions for insert to authenticated
  with check (
    public.is_first_timer_manager()
    and created_by = (select auth.uid())
    and (
      public.is_church_leader()
      or branch_id = public.current_branch_id()
    )
  );

create policy "Super admins delete first timer interactions"
  on public.first_timer_interactions for delete to authenticated
  using (public.is_super_admin());

create policy "First timer managers view visits"
  on public.first_timer_visits for select to authenticated
  using (
    public.is_church_leader()
    or (
      public.current_profile_role() = 'first_timer_coordinator'
      and branch_id = public.current_branch_id()
    )
  );

create policy "First timer managers create visits"
  on public.first_timer_visits for insert to authenticated
  with check (
    public.is_first_timer_manager()
    and recorded_by = (select auth.uid())
    and (
      public.is_church_leader()
      or branch_id = public.current_branch_id()
    )
  );

create policy "Super admins delete first timer visits"
  on public.first_timer_visits for delete to authenticated
  using (public.is_super_admin());

create policy "First timer managers view stage history"
  on public.first_timer_stage_history for select to authenticated
  using (
    public.is_church_leader()
    or (
      public.current_profile_role() = 'first_timer_coordinator'
      and branch_id = public.current_branch_id()
    )
  );

