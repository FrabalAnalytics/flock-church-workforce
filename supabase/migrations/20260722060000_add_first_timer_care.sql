-- Coordinator-led first-timer registration, follow-up and return-visit care.

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'pending', 'super_admin', 'church_leader', 'department_head',
    'first_timer_coordinator'
  ));

-- Extend protected managed-account deletion to the new coordinator role.
create or replace function public.delete_managed_user(
  p_user_id uuid,
  p_confirmation text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_name text;
  target_role text;
  super_admin_count integer;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can delete managed accounts';
  end if;
  if p_user_id is null or p_user_id = actor_id then
    raise exception 'You cannot delete your own account';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(73462591);
  select profile.full_name, profile.role
    into target_name, target_role
  from public.profiles as profile
  where profile.id = p_user_id
  for update;
  if not found then
    raise exception 'The selected account no longer exists';
  end if;
  if target_role not in (
    'church_leader', 'first_timer_coordinator', 'super_admin'
  ) then
    raise exception 'Only managed leadership and coordinator accounts can be deleted here';
  end if;
  if trim(coalesce(p_confirmation, '')) <> target_name then
    raise exception 'Enter the account holder''s exact full name to confirm deletion';
  end if;
  if target_role = 'super_admin' then
    select count(*) into super_admin_count
    from public.profiles where role = 'super_admin';
    if super_admin_count <= 1 then
      raise exception 'The final Super Admin account cannot be deleted';
    end if;
  end if;

  delete from auth.users where id = p_user_id;
  if not found then
    raise exception 'The authentication account no longer exists';
  end if;
  return target_name;
end;
$$;

revoke all on function public.delete_managed_user(uuid, text) from public;
grant execute on function public.delete_managed_user(uuid, text)
  to authenticated;

create table if not exists public.first_timers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone_number text not null check (char_length(trim(phone_number)) between 7 and 40),
  phone_number_normalized text not null
    check (char_length(phone_number_normalized) between 7 and 20),
  email text check (email is null or char_length(email) <= 254),
  preferred_contact text not null default 'phone'
    check (preferred_contact in ('phone', 'whatsapp', 'sms', 'email', 'none')),
  consent_to_contact boolean not null default false,
  consent_recorded_at timestamptz,
  first_visit_date date not null default current_date,
  first_service_type text not null check (first_service_type in (
    'Sunday Service', 'Tuesday Service', 'Special Service',
    'Headquarters Service', 'Tarry Night'
  )),
  location text check (location is null or char_length(location) <= 160),
  how_heard text check (how_heard is null or char_length(how_heard) <= 240),
  interests text check (interests is null or char_length(interests) <= 500),
  journey_stage text not null default 'new' check (journey_stage in (
    'new', 'assigned', 'contacted', 'follow_up', 'returned',
    'connected', 'integrated', 'closed'
  )),
  assigned_to uuid references public.profiles(id) on delete set null,
  registered_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  next_followup_at timestamptz,
  last_contacted_at timestamptz,
  closed_reason text check (closed_reason is null or char_length(closed_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (consent_to_contact = false and consent_recorded_at is null)
    or (consent_to_contact = true and consent_recorded_at is not null)
  ),
  check (
    journey_stage <> 'closed'
    or closed_reason is not null
  )
);

create table if not exists public.first_timer_interactions (
  id uuid primary key default gen_random_uuid(),
  first_timer_id uuid not null references public.first_timers(id) on delete cascade,
  interaction_type text not null check (interaction_type in (
    'call', 'whatsapp', 'sms', 'email', 'visit', 'note'
  )),
  outcome text not null check (char_length(trim(outcome)) between 2 and 240),
  notes text check (notes is null or char_length(notes) <= 2000),
  next_followup_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.first_timer_visits (
  id uuid primary key default gen_random_uuid(),
  first_timer_id uuid not null references public.first_timers(id) on delete cascade,
  visit_date date not null default current_date,
  service_type text not null check (service_type in (
    'Sunday Service', 'Tuesday Service', 'Special Service',
    'Headquarters Service', 'Tarry Night'
  )),
  notes text check (notes is null or char_length(notes) <= 500),
  recorded_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  unique (first_timer_id, visit_date, service_type)
);

create index if not exists first_timers_phone_normalized_idx
  on public.first_timers (phone_number_normalized);
create index if not exists first_timers_stage_idx
  on public.first_timers (journey_stage);
create index if not exists first_timers_assigned_to_idx
  on public.first_timers (assigned_to);
create index if not exists first_timers_next_followup_idx
  on public.first_timers (next_followup_at)
  where journey_stage not in ('integrated', 'closed');
create index if not exists first_timer_interactions_person_idx
  on public.first_timer_interactions (first_timer_id, created_at desc);
create index if not exists first_timer_visits_person_idx
  on public.first_timer_visits (first_timer_id, visit_date desc);

create or replace function public.is_first_timer_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_profile_role() in (
      'super_admin', 'church_leader', 'first_timer_coordinator'
    ),
    false
  );
$$;

revoke all on function public.is_first_timer_manager() from public;
grant execute on function public.is_first_timer_manager() to authenticated;

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

revoke all on function public.prepare_first_timer_record() from public;
drop trigger if exists prepare_first_timer_record on public.first_timers;
create trigger prepare_first_timer_record
  before insert or update on public.first_timers
  for each row execute function public.prepare_first_timer_record();

create or replace function public.prepare_first_timer_child_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if tg_table_name = 'first_timer_interactions' then
      new.created_by := (select auth.uid());
    else
      new.recorded_by := (select auth.uid());
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.prepare_first_timer_child_record() from public;
drop trigger if exists prepare_first_timer_interaction on public.first_timer_interactions;
create trigger prepare_first_timer_interaction
  before insert on public.first_timer_interactions
  for each row execute function public.prepare_first_timer_child_record();
drop trigger if exists prepare_first_timer_visit on public.first_timer_visits;
create trigger prepare_first_timer_visit
  before insert on public.first_timer_visits
  for each row execute function public.prepare_first_timer_child_record();

drop trigger if exists audit_first_timers on public.first_timers;
create trigger audit_first_timers
  after insert or update or delete on public.first_timers
  for each row execute function public.record_audit_event();
drop trigger if exists audit_first_timer_interactions on public.first_timer_interactions;
create trigger audit_first_timer_interactions
  after insert or update or delete on public.first_timer_interactions
  for each row execute function public.record_audit_event();
drop trigger if exists audit_first_timer_visits on public.first_timer_visits;
create trigger audit_first_timer_visits
  after insert or update or delete on public.first_timer_visits
  for each row execute function public.record_audit_event();

alter table public.first_timers enable row level security;
alter table public.first_timer_interactions enable row level security;
alter table public.first_timer_visits enable row level security;

drop policy if exists "First timer team can view coordinators" on public.profiles;
create policy "First timer team can view coordinators"
  on public.profiles for select to authenticated
  using (
    public.is_first_timer_manager()
    and role = 'first_timer_coordinator'
  );

drop policy if exists "First timer managers view people" on public.first_timers;
create policy "First timer managers view people"
  on public.first_timers for select to authenticated
  using (public.is_first_timer_manager());
drop policy if exists "First timer managers create people" on public.first_timers;
create policy "First timer managers create people"
  on public.first_timers for insert to authenticated
  with check (
    public.is_first_timer_manager()
    and registered_by = (select auth.uid())
  );
drop policy if exists "First timer managers update people" on public.first_timers;
create policy "First timer managers update people"
  on public.first_timers for update to authenticated
  using (public.is_first_timer_manager())
  with check (public.is_first_timer_manager());
drop policy if exists "Super admins delete first timers" on public.first_timers;
create policy "Super admins delete first timers"
  on public.first_timers for delete to authenticated
  using (public.is_super_admin());

drop policy if exists "First timer managers view interactions" on public.first_timer_interactions;
create policy "First timer managers view interactions"
  on public.first_timer_interactions for select to authenticated
  using (public.is_first_timer_manager());
drop policy if exists "First timer managers create interactions" on public.first_timer_interactions;
create policy "First timer managers create interactions"
  on public.first_timer_interactions for insert to authenticated
  with check (
    public.is_first_timer_manager()
    and created_by = (select auth.uid())
  );
drop policy if exists "Super admins delete first timer interactions" on public.first_timer_interactions;
create policy "Super admins delete first timer interactions"
  on public.first_timer_interactions for delete to authenticated
  using (public.is_super_admin());

drop policy if exists "First timer managers view visits" on public.first_timer_visits;
create policy "First timer managers view visits"
  on public.first_timer_visits for select to authenticated
  using (public.is_first_timer_manager());
drop policy if exists "First timer managers create visits" on public.first_timer_visits;
create policy "First timer managers create visits"
  on public.first_timer_visits for insert to authenticated
  with check (
    public.is_first_timer_manager()
    and recorded_by = (select auth.uid())
  );
drop policy if exists "Super admins delete first timer visits" on public.first_timer_visits;
create policy "Super admins delete first timer visits"
  on public.first_timer_visits for delete to authenticated
  using (public.is_super_admin());

revoke all on table public.first_timers from anon;
revoke all on table public.first_timer_interactions from anon;
revoke all on table public.first_timer_visits from anon;
grant select, insert, update, delete on table public.first_timers to authenticated;
grant select, insert, delete on table public.first_timer_interactions to authenticated;
grant select, insert, delete on table public.first_timer_visits to authenticated;
