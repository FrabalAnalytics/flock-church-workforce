-- Add an optional, constrained sex field to worker records. Existing workers
-- remain valid until a Super Admin updates their profile.

alter table public.workers
  add column sex text;

alter table public.workers
  add constraint workers_sex_check
  check (sex is null or sex in ('Male', 'Female'));
