-- Super Admin church settings and operational job health.

create table if not exists public.church_settings (
  id uuid primary key default '00000000-0000-4000-8000-000000000001',
  church_name text not null default 'Flock Church'
    check (char_length(church_name) between 2 and 120),
  timezone text not null default 'Africa/Lagos'
    check (char_length(timezone) between 3 and 80),
  care_message_signature text not null default 'TREM Flock'
    check (char_length(care_message_signature) between 2 and 80),
  contact_email text,
  contact_phone text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_settings_singleton
    check (id = '00000000-0000-4000-8000-000000000001')
);

insert into public.church_settings (id)
values ('00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

create table if not exists public.system_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null check (char_length(job_name) between 2 and 80),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  processed_count integer not null default 0 check (processed_count >= 0),
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists system_job_runs_latest_idx
  on public.system_job_runs (job_name, started_at desc);

alter table public.church_settings enable row level security;
alter table public.system_job_runs enable row level security;

create policy "Super admins manage church settings"
  on public.church_settings for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins view system job runs"
  on public.system_job_runs for select to authenticated
  using (public.is_super_admin());

revoke all on table public.church_settings from anon;
revoke all on table public.system_job_runs from anon;
revoke all on table public.system_job_runs from authenticated;
grant select, insert, update on table public.church_settings to authenticated;
grant select on table public.system_job_runs to authenticated;

drop trigger if exists audit_church_settings on public.church_settings;
create trigger audit_church_settings
  after insert or update or delete on public.church_settings
  for each row execute function public.record_audit_event();
