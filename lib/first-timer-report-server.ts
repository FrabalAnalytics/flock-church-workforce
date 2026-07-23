import "server-only";
import { buildFirstTimerMovementAnalytics, type FirstTimerMovementPerson, type FirstTimerStageTransition } from "@/lib/first-timer-analytics";
import type { FirstTimerStage, MembershipTrainingStatus } from "@/lib/first-timers";
import { createClient } from "@/lib/supabase/server";

type Filters = { from: string; to: string; coordinator: string | null };

type PersonRow = {
  id: string;
  full_name: string;
  first_visit_date: string;
  journey_stage: FirstTimerStage;
  membership_training_status: MembershipTrainingStatus;
  membership_training_started_at: string | null;
  membership_training_completed_at: string | null;
  assigned_to: string | null;
  next_followup_at: string | null;
  created_at: string;
  first_timer_visits: Array<{ visit_date: string }>;
};

type TransitionRow = {
  first_timer_id: string;
  from_stage: FirstTimerStage | null;
  to_stage: FirstTimerStage;
  changed_at: string;
};

export async function loadFirstTimerMovementReport(filters: Filters) {
  const supabase = await createClient();
  let peopleQuery = supabase
    .from("first_timers")
    .select("id, full_name, first_visit_date, journey_stage, membership_training_status, membership_training_started_at, membership_training_completed_at, assigned_to, next_followup_at, created_at, first_timer_visits(visit_date)")
    .gte("first_visit_date", filters.from)
    .lte("first_visit_date", filters.to)
    .order("first_visit_date", { ascending: true })
    .limit(5000);
  let transitionQuery = supabase
    .from("first_timer_stage_history")
    .select("first_timer_id, from_stage, to_stage, changed_at, first_timers!inner(first_visit_date, assigned_to)")
    .gte("first_timers.first_visit_date", filters.from)
    .lte("first_timers.first_visit_date", filters.to)
    .order("changed_at", { ascending: true })
    .limit(10000);

  if (filters.coordinator === "unassigned") {
    peopleQuery = peopleQuery.is("assigned_to", null);
    transitionQuery = transitionQuery.is("first_timers.assigned_to", null);
  } else if (filters.coordinator) {
    peopleQuery = peopleQuery.eq("assigned_to", filters.coordinator);
    transitionQuery = transitionQuery.eq("first_timers.assigned_to", filters.coordinator);
  }

  const [peopleResult, transitionResult, coordinatorResult] = await Promise.all([
    peopleQuery,
    transitionQuery,
    supabase.from("profiles").select("id, full_name").eq("role", "first_timer_coordinator").order("full_name"),
  ]);
  const error = peopleResult.error ?? transitionResult.error ?? coordinatorResult.error;
  const peopleRows = (peopleResult.data ?? []) as unknown as PersonRow[];
  const transitionRows = (transitionResult.data ?? []) as unknown as TransitionRow[];
  const people: FirstTimerMovementPerson[] = peopleRows.map((person) => ({
    id: person.id,
    fullName: person.full_name,
    firstVisitDate: person.first_visit_date,
    journeyStage: person.journey_stage,
    trainingStatus: person.membership_training_status,
    trainingStartedAt: person.membership_training_started_at,
    trainingCompletedAt: person.membership_training_completed_at,
    assignedTo: person.assigned_to,
    nextFollowupAt: person.next_followup_at,
    createdAt: person.created_at,
    visits: (person.first_timer_visits ?? []).map((visit) => ({ visitDate: visit.visit_date })),
  }));
  const transitions: FirstTimerStageTransition[] = transitionRows.map((transition) => ({
    firstTimerId: transition.first_timer_id,
    fromStage: transition.from_stage,
    toStage: transition.to_stage,
    changedAt: transition.changed_at,
  }));
  const coordinators = (coordinatorResult.data ?? []).map((coordinator) => ({ id: coordinator.id, name: coordinator.full_name }));

  return {
    error,
    people,
    transitions,
    coordinators,
    analytics: buildFirstTimerMovementAnalytics({ people, transitions, coordinators, from: filters.from, to: filters.to }),
  };
}
