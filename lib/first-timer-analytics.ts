import type { FirstTimerStage, MembershipTrainingStatus } from "./first-timers";

const analyticsStages: FirstTimerStage[] = ["new", "assigned", "contacted", "follow_up", "returned", "connected", "membership_training", "member", "closed"];
const analyticsStageLabels: Record<FirstTimerStage, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  follow_up: "Follow-up",
  returned: "Returned",
  connected: "Connected",
  membership_training: "Membership training",
  member: "Member",
  closed: "Closed",
};

export type FirstTimerMovementPerson = {
  id: string;
  fullName: string;
  firstVisitDate: string;
  journeyStage: FirstTimerStage;
  trainingStatus: MembershipTrainingStatus;
  trainingStartedAt: string | null;
  trainingCompletedAt: string | null;
  assignedTo: string | null;
  nextFollowupAt: string | null;
  createdAt: string;
  visits: Array<{ visitDate: string }>;
};

export type FirstTimerStageTransition = {
  firstTimerId: string;
  fromStage: FirstTimerStage | null;
  toStage: FirstTimerStage;
  changedAt: string;
};

export type FirstTimerCoordinator = { id: string; name: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function defaultFirstTimerReportPeriod(today = new Date()) {
  const to = new Date(today);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 89);
  return { from: isoDate(from), to: isoDate(to) };
}

export function validateFirstTimerReportFilters(input: { from?: string | null; to?: string | null; coordinator?: string | null }, today = new Date()) {
  const fallback = defaultFirstTimerReportPeriod(today);
  const from = input.from || fallback.from;
  const to = input.to || fallback.to;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return "Use valid report dates.";
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const days = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (!Number.isFinite(days) || days < 1 || days > 730) return "Choose a report period between 1 and 730 days.";
  const coordinator = input.coordinator || null;
  if (coordinator && coordinator !== "unassigned" && !uuidPattern.test(coordinator)) return "Choose a valid coordinator.";
  return { from, to, coordinator };
}

function daysBetween(from: string, to: string) {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime();
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function buildFirstTimerMovementAnalytics(input: {
  people: FirstTimerMovementPerson[];
  transitions: FirstTimerStageTransition[];
  coordinators: FirstTimerCoordinator[];
  from: string;
  to: string;
  now?: Date;
}) {
  const { people, transitions, coordinators, from, to } = input;
  const now = input.now ?? new Date();
  const transitionsByPerson = new Map<string, FirstTimerStageTransition[]>();
  for (const transition of transitions) {
    const list = transitionsByPerson.get(transition.firstTimerId) ?? [];
    list.push(transition);
    transitionsByPerson.set(transition.firstTimerId, list);
  }
  for (const list of transitionsByPerson.values()) list.sort((a, b) => a.changedAt.localeCompare(b.changedAt));

  const reached = (person: FirstTimerMovementPerson, stage: FirstTimerStage) =>
    person.journeyStage === stage || (transitionsByPerson.get(person.id) ?? []).some((transition) => transition.toStage === stage);
  const returned = people.filter((person) => person.visits.length >= 2 || reached(person, "returned") || reached(person, "connected") || reached(person, "membership_training") || reached(person, "member"));
  const connected = people.filter((person) => reached(person, "connected") || reached(person, "membership_training") || reached(person, "member"));
  const trainingStarted = people.filter((person) => person.trainingStatus !== "not_started");
  const trainingCompleted = people.filter((person) => person.trainingStatus === "completed");
  const members = people.filter((person) => reached(person, "member"));
  const funnel = [
    { key: "registered", label: "Registered", count: people.length, rate: 100 },
    { key: "returned", label: "Returned", count: returned.length, rate: percentage(returned.length, people.length) },
    { key: "connected", label: "Connected", count: connected.length, rate: percentage(connected.length, people.length) },
    { key: "training_started", label: "Training started", count: trainingStarted.length, rate: percentage(trainingStarted.length, people.length) },
    { key: "training_completed", label: "Training completed", count: trainingCompleted.length, rate: percentage(trainingCompleted.length, people.length) },
    { key: "member", label: "Member", count: members.length, rate: percentage(members.length, people.length) },
  ];

  const returnDays = returned.flatMap((person) => {
    const visits = person.visits.map((visit) => visit.visitDate).sort();
    return visits[1] ? [daysBetween(person.firstVisitDate, visits[1])] : [];
  });
  const trainingDays = trainingStarted.flatMap((person) => person.trainingStartedAt ? [daysBetween(person.firstVisitDate, person.trainingStartedAt)] : []);
  const memberDays = members.flatMap((person) => {
    const transition = (transitionsByPerson.get(person.id) ?? []).find((item) => item.toStage === "member" && item.fromStage !== null);
    return transition ? [daysBetween(person.firstVisitDate, transition.changedAt)] : [];
  });

  const monthFormatter = new Intl.DateTimeFormat("en-NG", { month: "short", year: "2-digit", timeZone: "UTC" });
  const monthCounts = new Map<string, number>();
  for (const person of people) {
    const key = person.firstVisitDate.slice(0, 7);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const registrationTrend: Array<{ label: string; value: number; detail: string }> = [];
  const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00Z`);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 7);
    const value = monthCounts.get(key) ?? 0;
    const label = monthFormatter.format(cursor);
    registrationTrend.push({ label, value, detail: `${value} first timer${value === 1 ? "" : "s"} first visited in ${label}` });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const stageDistribution = analyticsStages.map((stage) => ({
    stage,
    label: analyticsStageLabels[stage],
    count: people.filter((person) => person.journeyStage === stage).length,
  })).filter((item) => item.count > 0);

  const coordinatorNames = new Map(coordinators.map((coordinator) => [coordinator.id, coordinator.name]));
  const coordinatorPerformance = [...people.reduce((groups, person) => {
    const key = person.assignedTo ?? "unassigned";
    const current = groups.get(key) ?? { coordinatorId: key, coordinator: key === "unassigned" ? "Unassigned" : coordinatorNames.get(key) ?? "Former coordinator", journeys: 0, active: 0, overdue: 0, members: 0 };
    current.journeys += 1;
    if (!["member", "closed"].includes(person.journeyStage)) current.active += 1;
    if (person.nextFollowupAt && new Date(person.nextFollowupAt) <= now && !["member", "closed"].includes(person.journeyStage)) current.overdue += 1;
    if (reached(person, "member")) current.members += 1;
    groups.set(key, current);
    return groups;
  }, new Map<string, { coordinatorId: string; coordinator: string; journeys: number; active: number; overdue: number; members: number }>()).values()]
    .map((item) => ({ ...item, conversionRate: percentage(item.members, item.journeys) }))
    .sort((a, b) => b.journeys - a.journeys || a.coordinator.localeCompare(b.coordinator));

  const stalled = people.flatMap((person) => {
    if (["member", "closed"].includes(person.journeyStage)) return [];
    const latestTransition = (transitionsByPerson.get(person.id) ?? []).at(-1)?.changedAt ?? person.createdAt;
    const daysInStage = daysBetween(latestTransition, now.toISOString());
    const overdue = Boolean(person.nextFollowupAt && new Date(person.nextFollowupAt) <= now);
    if (daysInStage < 30 && !overdue) return [];
    return [{
      id: person.id,
      fullName: person.fullName,
      stage: person.journeyStage,
      stageLabel: analyticsStageLabels[person.journeyStage],
      coordinator: person.assignedTo ? coordinatorNames.get(person.assignedTo) ?? "Former coordinator" : "Unassigned",
      daysInStage,
      overdue,
    }];
  }).sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.daysInStage - a.daysInStage);

  return {
    total: people.length,
    returned: returned.length,
    members: members.length,
    memberConversionRate: percentage(members.length, people.length),
    returnRate: percentage(returned.length, people.length),
    trainingCompletionRate: percentage(trainingCompleted.length, trainingStarted.length),
    averageDaysToReturn: average(returnDays),
    averageDaysToTraining: average(trainingDays),
    averageDaysToMembership: average(memberDays),
    funnel,
    registrationTrend,
    stageDistribution,
    coordinatorPerformance,
    stalled,
  };
}
