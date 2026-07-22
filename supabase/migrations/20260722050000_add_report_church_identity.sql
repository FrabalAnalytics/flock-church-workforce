-- Allow authenticated report generators to read only the configured church
-- name without exposing the remaining church_settings row.

create or replace function public.current_church_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select cs.church_name
      from public.church_settings as cs
      where cs.id = '00000000-0000-4000-8000-000000000001'
    ),
    'Flock Church'
  );
$$;

revoke all on function public.current_church_name() from public;
grant execute on function public.current_church_name() to authenticated;
