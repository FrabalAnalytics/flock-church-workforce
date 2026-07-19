-- Super-admin-only correction RPCs. These preserve service/date identity and
-- update related attendance information atomically.

alter table public.attendance_submissions
  add column if not exists corrected_by uuid
  references public.profiles(id) on delete set null;
alter table public.attendance_submissions
  add column if not exists corrected_at timestamptz;

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
  if not found then raise exception 'Church attendance record was not found'; end if;
end;
$$;

revoke all on function public.correct_church_attendance(
  uuid, integer, integer, integer, integer, integer, integer, integer, uuid, text
) from public;
grant execute on function public.correct_church_attendance(
  uuid, integer, integer, integer, integer, integer, integer, integer, uuid, text
) to authenticated;

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
  if p_submission_id is null then raise exception 'Select an attendance submission'; end if;

  select count(*) into roster_total
  from public.attendance_logs as log
  where log.submission_id = p_submission_id;
  if roster_total = 0 or not exists (
    select 1 from public.attendance_submissions as submission
    where submission.id = p_submission_id
  ) then
    raise exception 'Attendance submission was not found or has no worker records';
  end if;

  select count(*) into invalid_present_count
  from (
    select selected.id
    from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id)
    group by selected.id
  ) as selected
  left join public.attendance_logs as log
    on log.submission_id = p_submission_id and log.worker_id = selected.id
  where selected.id is null or log.id is null;
  if invalid_present_count > 0 then
    raise exception 'The present list contains a worker outside this submitted roster';
  end if;

  select count(distinct selected.id) into present_total
  from unnest(coalesce(p_present_worker_ids, array[]::uuid[])) as selected(id);

  update public.attendance_logs as log
  set status = case when log.worker_id = any(coalesce(p_present_worker_ids, array[]::uuid[])) then 'Present' else 'Absent' end
  where log.submission_id = p_submission_id
    and log.status is distinct from case when log.worker_id = any(coalesce(p_present_worker_ids, array[]::uuid[])) then 'Present' else 'Absent' end;

  update public.attendance_submissions
  set roster_count = roster_total,
      present_count = present_total,
      absent_count = roster_total - present_total,
      corrected_by = actor_id,
      corrected_at = now()
  where id = p_submission_id;
end;
$$;

revoke all on function public.correct_department_attendance(uuid, uuid[]) from public;
grant execute on function public.correct_department_attendance(uuid, uuid[]) to authenticated;
