-- Workspace-owner console for SaaS-wide administration.
--
-- This layer sits above the church HQ admin model. It lets a platform owner
-- create churches and branches without disturbing the existing single-church
-- workflow or the branch-scoped operational data model.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'pending', 'super_admin', 'workspace_owner', 'church_leader',
    'department_head', 'first_timer_coordinator'
  ));

create or replace function public.is_workspace_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() = 'workspace_owner', false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() in ('super_admin', 'workspace_owner'), false);
$$;

create or replace function public.is_church_leader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_profile_role() in ('super_admin', 'workspace_owner', 'church_leader'),
    false
  );
$$;

create or replace function public.is_first_timer_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_profile_role() in (
      'super_admin', 'workspace_owner', 'church_leader', 'first_timer_coordinator'
    ),
    false
  );
$$;

revoke all on function public.is_workspace_owner() from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.is_church_leader() from public;
revoke all on function public.is_first_timer_manager() from public;

grant execute on function public.is_workspace_owner() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_church_leader() to authenticated;
grant execute on function public.is_first_timer_manager() to authenticated;

create or replace function public.create_church_workspace(
  p_legal_name text,
  p_display_name text,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_church_id uuid := gen_random_uuid();
  new_branch_id uuid := gen_random_uuid();
  normalized_legal_name text := trim(coalesce(p_legal_name, ''));
  normalized_display_name text := trim(coalesce(p_display_name, ''));
  normalized_timezone text := coalesce(nullif(trim(coalesce(p_timezone, '')), ''), 'Africa/Lagos');
begin
  if not public.is_workspace_owner() then
    raise exception 'Only a workspace owner can create churches';
  end if;

  if char_length(normalized_legal_name) < 2 or char_length(normalized_legal_name) > 160 then
    raise exception 'Enter a valid legal name for the church';
  end if;
  if char_length(normalized_display_name) < 2 or char_length(normalized_display_name) > 160 then
    raise exception 'Enter a valid display name for the church';
  end if;

  insert into public.churches (id, legal_name, display_name, timezone, status)
  values (
    new_church_id,
    normalized_legal_name,
    normalized_display_name,
    normalized_timezone,
    'active'
  );

  insert into public.church_settings_by_church (
    church_id, church_name, timezone, care_message_signature, contact_email, contact_phone
  )
  values (
    new_church_id,
    normalized_display_name,
    normalized_timezone,
    'TREM Flock',
    null,
    null
  );

  insert into public.branches (id, church_id, name, code, is_hq, active)
  values (
    new_branch_id,
    new_church_id,
    normalized_display_name,
    'HQ',
    true,
    true
  );

  insert into public.branch_settings (
    branch_id, display_name, timezone, contact_email, contact_phone
  )
  values (
    new_branch_id,
    normalized_display_name,
    normalized_timezone,
    null,
    null
  );

  return new_church_id;
end;
$$;

create or replace function public.create_branch_workspace(
  p_church_id uuid,
  p_name text,
  p_code text,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_branch_id uuid := gen_random_uuid();
  normalized_name text := trim(coalesce(p_name, ''));
  normalized_code text := upper(trim(coalesce(p_code, '')));
  normalized_timezone text := nullif(trim(coalesce(p_timezone, '')), '');
  church_timezone text;
begin
  if not public.is_workspace_owner() then
    raise exception 'Only a workspace owner can create branches';
  end if;

  if p_church_id is null then
    raise exception 'Select a valid church';
  end if;
  if char_length(normalized_name) < 2 or char_length(normalized_name) > 160 then
    raise exception 'Enter a valid branch name';
  end if;
  if char_length(normalized_code) < 2 or char_length(normalized_code) > 40 then
    raise exception 'Enter a valid branch code';
  end if;

  select c.timezone
    into church_timezone
  from public.churches as c
  where c.id = p_church_id;

  if not found then
    raise exception 'Select a valid church';
  end if;

  insert into public.branches (id, church_id, name, code, is_hq, active)
  values (
    new_branch_id,
    p_church_id,
    normalized_name,
    normalized_code,
    false,
    true
  );

  insert into public.branch_settings (
    branch_id, display_name, timezone, contact_email, contact_phone
  )
  values (
    new_branch_id,
    normalized_name,
    coalesce(normalized_timezone, church_timezone),
    null,
    null
  );

  return new_branch_id;
end;
$$;

revoke all on function public.create_church_workspace(text, text, text) from public;
revoke all on function public.create_branch_workspace(uuid, text, text, text) from public;
grant execute on function public.create_church_workspace(text, text, text) to authenticated;
grant execute on function public.create_branch_workspace(uuid, text, text, text) to authenticated;
