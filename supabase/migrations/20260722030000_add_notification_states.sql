-- Per-user read and snooze state for derived Action Centre notifications.

create table if not exists public.notification_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_key text not null check (char_length(notification_key) between 8 and 200),
  read_at timestamptz,
  snoozed_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

create index if not exists notification_states_user_snoozed_idx
  on public.notification_states (user_id, snoozed_until);

alter table public.notification_states enable row level security;

create policy "Users manage own notification state"
  on public.notification_states for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.notification_states from anon;
grant select, insert, update, delete on table public.notification_states
  to authenticated;
