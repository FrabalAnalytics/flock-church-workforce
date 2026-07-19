-- Keep authenticated user identities centrally managed. Church Leaders and
-- Department Heads retain read access to authorized records, but only a
-- Super Admin may change profile names, phone numbers, roles or departments.
-- Password changes remain handled separately by Supabase Auth.

drop policy if exists "Users can update own profile" on public.profiles;

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
