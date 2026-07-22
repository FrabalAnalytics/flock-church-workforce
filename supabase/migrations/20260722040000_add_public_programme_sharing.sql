-- Revocable, least-privilege public links for published service programmes.
-- Share secrets live outside service_programmes so authenticated read-only
-- roles cannot retrieve them through the programme table API.

create table if not exists public.service_programme_shares (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null unique references public.service_programmes(id)
    on delete cascade,
  token text not null unique,
  enabled boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  check (token ~ '^[0-9a-f]{48}$'),
  check (expires_at is null or expires_at > created_at)
);

create index if not exists service_programme_shares_active_token_idx
  on public.service_programme_shares (token)
  where enabled = true;

-- Audit link lifecycle changes without copying the secret token into history.
create or replace function public.record_programme_share_audit_event()
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
    new_data := to_jsonb(new) - 'token';
    record_id := new.id;
  elsif tg_op = 'UPDATE' then
    old_data := to_jsonb(old) - 'token';
    new_data := to_jsonb(new) - 'token';
    if old_data = new_data then return new; end if;
    record_id := new.id;
  else
    old_data := to_jsonb(old) - 'token';
    record_id := old.id;
  end if;

  if current_actor_id is not null then
    select coalesce(nullif(trim(profile.full_name), ''), 'Authenticated user')
      into current_actor_name
    from public.profiles as profile
    where profile.id = current_actor_id;
    if not found then
      current_actor_id := null;
      current_actor_name := 'Authenticated user';
    end if;
  end if;

  insert into public.audit_events (
    entity_table, entity_id, action, actor_id, actor_name,
    before_data, after_data
  ) values (
    'service_programme_shares', record_id,
    case tg_op when 'INSERT' then 'inserted'
      when 'UPDATE' then 'updated' else 'deleted' end,
    current_actor_id, current_actor_name, old_data, new_data
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.record_programme_share_audit_event() from public;

drop trigger if exists audit_service_programme_shares
  on public.service_programme_shares;
create trigger audit_service_programme_shares
  after insert or update or delete on public.service_programme_shares
  for each row execute function public.record_programme_share_audit_event();

alter table public.service_programme_shares enable row level security;

drop policy if exists "Super admins manage programme shares"
  on public.service_programme_shares;
create policy "Super admins manage programme shares"
  on public.service_programme_shares for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

revoke all on table public.service_programme_shares from anon;
grant select, insert, update, delete
  on table public.service_programme_shares to authenticated;

-- The browser receives only presentation fields. It receives no internal IDs,
-- creator data, share token, or unpublished programme data.
create or replace function public.get_shared_service_programme(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'title', programme.title,
    'service_date', programme.service_date,
    'service_type', programme.service_type,
    'updated_at', programme.updated_at,
    'items', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'position', item.position,
          'start_time', item.start_time,
          'end_time', item.end_time,
          'event_name', item.event_name,
          'responsible_name', item.responsible_name,
          'duration_minutes', item.duration_minutes,
          'notes', item.notes
        ) order by item.position
      ) filter (where item.id is not null),
      '[]'::jsonb
    )
  )
  from public.service_programme_shares as share
  join public.service_programmes as programme
    on programme.id = share.programme_id
  left join public.service_programme_items as item
    on item.programme_id = programme.id
  where p_token ~ '^[0-9a-f]{48}$'
    and share.token = p_token
    and share.enabled = true
    and programme.status = 'published'
    and (share.expires_at is null or share.expires_at > now())
  group by programme.id;
$$;

revoke all on function public.get_shared_service_programme(text) from public;
grant execute on function public.get_shared_service_programme(text)
  to anon, authenticated;
