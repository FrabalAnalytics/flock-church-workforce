-- Multi-tenant foundation for Flock.
--
-- This migration is intentionally additive. It introduces a church/branch
-- hierarchy and scoped settings tables without changing the current
-- single-church application flow or removing existing data.

create extension if not exists "pgcrypto";

-- Tenant hierarchy -----------------------------------------------------------

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  timezone text not null default 'Africa/Lagos'
    check (char_length(timezone) between 3 and 80),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(legal_name)) between 2 and 160),
  check (char_length(trim(display_name)) between 2 and 160)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  code text not null,
  is_hq boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(name)) between 2 and 160),
  check (char_length(trim(code)) between 2 and 40)
);

create unique index if not exists branches_church_code_unique
  on public.branches (church_id, lower(trim(code)));

create unique index if not exists branches_church_name_unique
  on public.branches (church_id, lower(trim(name)));

create unique index if not exists one_hq_branch_per_church
  on public.branches (church_id)
  where is_hq = true;

-- Scoped settings ------------------------------------------------------------

create table if not exists public.church_settings_by_church (
  church_id uuid primary key references public.churches(id) on delete cascade,
  church_name text not null,
  timezone text not null default 'Africa/Lagos'
    check (char_length(timezone) between 3 and 80),
  care_message_signature text not null default 'TREM Flock'
    check (char_length(care_message_signature) between 2 and 80),
  contact_email text,
  contact_phone text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(church_name)) between 2 and 120)
);

create table if not exists public.branch_settings (
  branch_id uuid primary key references public.branches(id) on delete cascade,
  display_name text not null,
  timezone text,
  contact_email text,
  contact_phone text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(display_name)) between 2 and 120),
  check (timezone is null or char_length(trim(timezone)) between 3 and 80)
);

alter table public.churches enable row level security;
alter table public.branches enable row level security;
alter table public.church_settings_by_church enable row level security;
alter table public.branch_settings enable row level security;

drop policy if exists "Super admins manage churches" on public.churches;
drop policy if exists "Super admins manage branches" on public.branches;
drop policy if exists "Super admins manage church settings by church" on public.church_settings_by_church;
drop policy if exists "Super admins manage branch settings" on public.branch_settings;

create policy "Super admins manage churches"
  on public.churches for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins manage branches"
  on public.branches for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins manage church settings by church"
  on public.church_settings_by_church for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins manage branch settings"
  on public.branch_settings for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

revoke all on table public.churches from anon;
revoke all on table public.branches from anon;
revoke all on table public.church_settings_by_church from anon;
revoke all on table public.branch_settings from anon;

grant select, insert, update, delete on table public.churches to authenticated;
grant select, insert, update, delete on table public.branches to authenticated;
grant select, insert, update, delete on table public.church_settings_by_church to authenticated;
grant select, insert, update, delete on table public.branch_settings to authenticated;

-- Profile scope --------------------------------------------------------------

alter table public.profiles
  add column if not exists church_id uuid;
alter table public.profiles
  add column if not exists branch_id uuid;

alter table public.profiles
  drop constraint if exists profiles_church_id_fkey;
alter table public.profiles
  add constraint profiles_church_id_fkey
  foreign key (church_id) references public.churches(id) on delete restrict;

alter table public.profiles
  drop constraint if exists profiles_branch_id_fkey;
alter table public.profiles
  add constraint profiles_branch_id_fkey
  foreign key (branch_id) references public.branches(id) on delete set null;

create index if not exists profiles_church_id_idx
  on public.profiles (church_id);
create index if not exists profiles_branch_id_idx
  on public.profiles (branch_id);

-- Compatibility defaults for the current single-church deployment.
do $$
declare
  default_church_id constant uuid := '00000000-0000-4000-8000-000000000201';
  default_hq_branch_id constant uuid := '00000000-0000-4000-8000-000000000202';
  source_church_name text := 'Flock Church';
  source_timezone text := 'Africa/Lagos';
  source_signature text := 'TREM Flock';
  source_contact_email text;
  source_contact_phone text;
  source_updated_by uuid;
  source_created_at timestamptz := now();
  source_updated_at timestamptz := now();
begin
  select
    church_name,
    timezone,
    care_message_signature,
    contact_email,
    contact_phone,
    updated_by,
    created_at,
    updated_at
  into
    source_church_name,
    source_timezone,
    source_signature,
    source_contact_email,
    source_contact_phone,
    source_updated_by,
    source_created_at,
    source_updated_at
  from public.church_settings
  where id = '00000000-0000-4000-8000-000000000001';

  insert into public.churches (id, legal_name, display_name, timezone, status)
  values (
    default_church_id,
    source_church_name,
    source_church_name,
    source_timezone,
    'active'
  )
  on conflict (id) do update
  set legal_name = excluded.legal_name,
      display_name = excluded.display_name,
      timezone = excluded.timezone,
      status = excluded.status,
      updated_at = now();

  insert into public.branches (id, church_id, name, code, is_hq, active)
  values (
    default_hq_branch_id,
    default_church_id,
    coalesce(source_church_name, 'Flock HQ'),
    'HQ',
    true,
    true
  )
  on conflict (id) do update
  set church_id = excluded.church_id,
      name = excluded.name,
      code = excluded.code,
      is_hq = excluded.is_hq,
      active = excluded.active,
      updated_at = now();

  insert into public.church_settings_by_church (
    church_id,
    church_name,
    timezone,
    care_message_signature,
    contact_email,
    contact_phone,
    updated_by,
    created_at,
    updated_at
  )
  values (
    default_church_id,
    source_church_name,
    source_timezone,
    source_signature,
    source_contact_email,
    source_contact_phone,
    source_updated_by,
    source_created_at,
    source_updated_at
  )
  on conflict (church_id) do update
  set church_name = excluded.church_name,
      timezone = excluded.timezone,
      care_message_signature = excluded.care_message_signature,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      updated_by = excluded.updated_by,
      updated_at = now();

  insert into public.branch_settings (
    branch_id,
    display_name,
    timezone,
    contact_email,
    contact_phone,
    updated_by,
    created_at,
    updated_at
  )
  values (
    default_hq_branch_id,
    coalesce(source_church_name, 'Flock HQ'),
    source_timezone,
    source_contact_email,
    source_contact_phone,
    source_updated_by,
    source_created_at,
    source_updated_at
  )
  on conflict (branch_id) do update
  set display_name = excluded.display_name,
      timezone = excluded.timezone,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      updated_by = excluded.updated_by,
      updated_at = now();

  update public.profiles
  set church_id = default_church_id,
      branch_id = default_hq_branch_id
  where church_id is null
     or branch_id is null;
end;
$$;

alter table public.profiles
  alter column church_id set default '00000000-0000-4000-8000-000000000201';
alter table public.profiles
  alter column branch_id set default '00000000-0000-4000-8000-000000000202';

alter table public.profiles
  alter column church_id set not null;
alter table public.profiles
  alter column branch_id set not null;

create or replace function public.current_church_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.church_id
  from public.profiles as p
  where p.id = (select auth.uid());
$$;

create or replace function public.current_branch_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.branch_id
  from public.profiles as p
  where p.id = (select auth.uid());
$$;

revoke all on function public.current_church_id() from public;
revoke all on function public.current_branch_id() from public;
grant execute on function public.current_church_id() to authenticated;
grant execute on function public.current_branch_id() to authenticated;

-- Keep tenant scope changes centrally managed.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and (
       old.role is distinct from new.role
       or old.email is distinct from new.email
       or old.department_id is distinct from new.department_id
       or old.church_id is distinct from new.church_id
       or old.branch_id is distinct from new.branch_id
     )
     and not public.is_super_admin()
  then
    raise exception 'Only a super admin can change protected profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

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
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000202'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
