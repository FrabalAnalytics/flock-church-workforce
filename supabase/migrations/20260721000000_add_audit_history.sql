-- Immutable audit history for high-risk administrative and operational data.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,
  entity_id uuid not null,
  action text not null check (action in ('inserted', 'updated', 'deleted')),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'System',
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  check (char_length(entity_table) between 1 and 80),
  check (
    (action = 'inserted' and before_data is null and after_data is not null)
    or (action = 'updated' and before_data is not null and after_data is not null)
    or (action = 'deleted' and before_data is not null and after_data is null)
  )
);

create index if not exists audit_events_created_at_idx
  on public.audit_events (created_at desc);
create index if not exists audit_events_entity_idx
  on public.audit_events (entity_table, entity_id, created_at desc);
create index if not exists audit_events_actor_id_idx
  on public.audit_events (actor_id, created_at desc);

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
    entity_table,
    entity_id,
    action,
    actor_id,
    actor_name,
    before_data,
    after_data
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
    new_data
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.record_audit_event() from public;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.record_audit_event();

drop trigger if exists audit_departments on public.departments;
create trigger audit_departments
  after insert or update or delete on public.departments
  for each row execute function public.record_audit_event();

drop trigger if exists audit_workers on public.workers;
create trigger audit_workers
  after insert or update or delete on public.workers
  for each row execute function public.record_audit_event();

drop trigger if exists audit_services on public.services;
create trigger audit_services
  after insert or update or delete on public.services
  for each row execute function public.record_audit_event();

drop trigger if exists audit_service_expectations
  on public.service_department_expectations;
create trigger audit_service_expectations
  after insert or update or delete on public.service_department_expectations
  for each row execute function public.record_audit_event();

drop trigger if exists audit_attendance_submissions
  on public.attendance_submissions;
create trigger audit_attendance_submissions
  after insert or update or delete on public.attendance_submissions
  for each row execute function public.record_audit_event();

drop trigger if exists audit_church_attendance on public.church_attendance;
create trigger audit_church_attendance
  after insert or update or delete on public.church_attendance
  for each row execute function public.record_audit_event();

drop trigger if exists audit_absence_followups on public.absence_followups;
create trigger audit_absence_followups
  after insert or update or delete on public.absence_followups
  for each row execute function public.record_audit_event();

drop trigger if exists audit_ministers on public.ministers;
create trigger audit_ministers
  after insert or update or delete on public.ministers
  for each row execute function public.record_audit_event();

drop trigger if exists audit_service_programmes on public.service_programmes;
create trigger audit_service_programmes
  after insert or update or delete on public.service_programmes
  for each row execute function public.record_audit_event();

drop trigger if exists audit_service_programme_items
  on public.service_programme_items;
create trigger audit_service_programme_items
  after insert or update or delete on public.service_programme_items
  for each row execute function public.record_audit_event();

alter table public.audit_events enable row level security;

create policy "Super admins view audit events"
  on public.audit_events for select to authenticated
  using (public.is_super_admin());

revoke all on table public.audit_events from anon;
revoke all on table public.audit_events from authenticated;
grant select on table public.audit_events to authenticated;
