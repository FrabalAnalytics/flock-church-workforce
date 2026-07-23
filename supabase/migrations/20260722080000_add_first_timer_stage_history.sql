-- Preserve every first-timer journey-stage transition for leadership analysis.

create table if not exists public.first_timer_stage_history (
  id uuid primary key default gen_random_uuid(),
  first_timer_id uuid not null references public.first_timers(id)
    on delete cascade,
  from_stage text check (from_stage is null or from_stage in (
    'new', 'assigned', 'contacted', 'follow_up', 'returned', 'connected',
    'membership_training', 'member', 'closed'
  )),
  to_stage text not null check (to_stage in (
    'new', 'assigned', 'contacted', 'follow_up', 'returned', 'connected',
    'membership_training', 'member', 'closed'
  )),
  changed_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  changed_at timestamptz not null default now(),
  check (from_stage is null or from_stage <> to_stage)
);

create index if not exists first_timer_stage_history_person_idx
  on public.first_timer_stage_history (first_timer_id, changed_at);
create index if not exists first_timer_stage_history_changed_at_idx
  on public.first_timer_stage_history (changed_at desc);
create index if not exists first_timer_stage_history_to_stage_idx
  on public.first_timer_stage_history (to_stage, changed_at desc);

create or replace function public.record_first_timer_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.first_timer_stage_history (
      first_timer_id, from_stage, to_stage, changed_by, changed_at
    ) values (
      new.id, null, new.journey_stage,
      coalesce((select auth.uid()), new.registered_by), new.created_at
    );
  elsif old.journey_stage is distinct from new.journey_stage then
    insert into public.first_timer_stage_history (
      first_timer_id, from_stage, to_stage, changed_by
    ) values (
      new.id, old.journey_stage, new.journey_stage, (select auth.uid())
    );
  end if;
  return new;
end;
$$;

revoke all on function public.record_first_timer_stage_change() from public;
drop trigger if exists record_first_timer_stage_change on public.first_timers;
create trigger record_first_timer_stage_change
  after insert or update of journey_stage on public.first_timers
  for each row execute function public.record_first_timer_stage_change();

-- Existing journeys get one honest baseline at their current stage. Historical
-- transitions before this migration are intentionally not reconstructed.
insert into public.first_timer_stage_history (
  first_timer_id, from_stage, to_stage, changed_by, changed_at
)
select ft.id, null, ft.journey_stage, ft.registered_by, now()
from public.first_timers as ft
where not exists (
  select 1
  from public.first_timer_stage_history as history
  where history.first_timer_id = ft.id
);

alter table public.first_timer_stage_history enable row level security;

drop policy if exists "First timer managers view stage history"
  on public.first_timer_stage_history;
create policy "First timer managers view stage history"
  on public.first_timer_stage_history for select to authenticated
  using (public.is_first_timer_manager());

revoke all on table public.first_timer_stage_history from anon;
revoke insert, update, delete on table public.first_timer_stage_history
  from authenticated;
grant select on table public.first_timer_stage_history to authenticated;
