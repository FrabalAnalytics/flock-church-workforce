-- Super-admin account deletion with safeguards and preserved history.

-- Attendance history must survive when the submitting login is removed.
alter table public.attendance_submissions
  alter column submitted_by drop not null;

alter table public.attendance_submissions
  drop constraint if exists attendance_submissions_submitted_by_fkey;

alter table public.attendance_submissions
  add constraint attendance_submissions_submitted_by_fkey
  foreign key (submitted_by) references public.profiles(id) on delete set null;

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

  -- Serialize privileged deletions so two administrators cannot race the
  -- final-super-admin safeguard.
  perform pg_catalog.pg_advisory_xact_lock(73462591);

  select profile.full_name, profile.role
    into target_name, target_role
  from public.profiles as profile
  where profile.id = p_user_id
  for update;

  if not found then
    raise exception 'The selected account no longer exists';
  end if;

  if target_role not in ('church_leader', 'super_admin') then
    raise exception 'Only Church Leader and Super Admin accounts can be deleted here';
  end if;

  if trim(coalesce(p_confirmation, '')) <> target_name then
    raise exception 'Enter the account holder''s exact full name to confirm deletion';
  end if;

  if target_role = 'super_admin' then
    select count(*)
      into super_admin_count
    from public.profiles
    where role = 'super_admin';

    if super_admin_count <= 1 then
      raise exception 'The final Super Admin account cannot be deleted';
    end if;
  end if;

  delete from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'The authentication account no longer exists';
  end if;

  return target_name;
end;
$$;

revoke all on function public.delete_managed_user(uuid, text) from public;
grant execute on function public.delete_managed_user(uuid, text)
  to authenticated;
