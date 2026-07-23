-- Require documented membership training before a first timer becomes a member.

alter table public.first_timers
  add column if not exists membership_training_status text not null
    default 'not_started';
alter table public.first_timers
  add column if not exists membership_training_started_at date;
alter table public.first_timers
  add column if not exists membership_training_completed_at date;
alter table public.first_timers
  add column if not exists membership_training_notes text;

-- Earlier releases called the terminal stage "integrated". Move those records
-- back into the training checkpoint so coordinators can verify completion.
alter table public.first_timers
  drop constraint if exists first_timers_journey_stage_check;

update public.first_timers
set journey_stage = 'membership_training'
where journey_stage = 'integrated';

alter table public.first_timers
  add constraint first_timers_journey_stage_check
  check (journey_stage in (
    'new', 'assigned', 'contacted', 'follow_up', 'returned', 'connected',
    'membership_training', 'member', 'closed'
  ));

alter table public.first_timers
  drop constraint if exists first_timers_membership_training_status_check;
alter table public.first_timers
  add constraint first_timers_membership_training_status_check
  check (membership_training_status in (
    'not_started', 'in_progress', 'completed'
  ));

alter table public.first_timers
  drop constraint if exists first_timers_membership_training_notes_check;
alter table public.first_timers
  add constraint first_timers_membership_training_notes_check
  check (
    membership_training_notes is null
    or char_length(membership_training_notes) <= 500
  );

alter table public.first_timers
  drop constraint if exists first_timers_membership_training_state;
alter table public.first_timers
  add constraint first_timers_membership_training_state
  check (
    (
      membership_training_status = 'not_started'
      and membership_training_started_at is null
      and membership_training_completed_at is null
    )
    or (
      membership_training_status = 'in_progress'
      and membership_training_started_at is not null
      and membership_training_completed_at is null
    )
    or (
      membership_training_status = 'completed'
      and membership_training_started_at is not null
      and membership_training_completed_at is not null
      and membership_training_completed_at >= membership_training_started_at
    )
  );

alter table public.first_timers
  drop constraint if exists first_timers_member_requires_training;
alter table public.first_timers
  add constraint first_timers_member_requires_training
  check (
    journey_stage <> 'member'
    or membership_training_status = 'completed'
  );

drop index if exists public.first_timers_next_followup_idx;
create index first_timers_next_followup_idx
  on public.first_timers (next_followup_at)
  where journey_stage not in ('member', 'closed');
