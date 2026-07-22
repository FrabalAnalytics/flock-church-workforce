export type OnboardingMetrics = {
  churchProfileReady: boolean;
  departmentCount: number;
  superAdminCount: number;
  activeWorkerCount: number;
  attendanceSubmissionCount: number;
};

export type OnboardingStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  action: string;
  complete: boolean;
};

export function buildOnboardingSteps(metrics: OnboardingMetrics): OnboardingStep[] {
  return [
    {
      key: "identity",
      title: "Complete the church profile",
      description: "Confirm the church name, timezone, care-message signature, and a contact channel.",
      href: "/app/settings",
      action: "Open settings",
      complete: metrics.churchProfileReady,
    },
    {
      key: "departments",
      title: "Review ministry departments",
      description: "Keep only the departments used by your church and make their names consistent.",
      href: "/app/departments",
      action: "Review departments",
      complete: metrics.departmentCount > 0,
    },
    {
      key: "administrators",
      title: "Assign a backup Super Admin",
      description: "A second trusted administrator prevents the church from losing access when one account is unavailable.",
      href: "/app/users",
      action: "Manage users",
      complete: metrics.superAdminCount >= 2,
    },
    {
      key: "workers",
      title: "Add the active worker roster",
      description: "Create workers individually or import the existing church register from CSV.",
      href: metrics.activeWorkerCount ? "/app/workers" : "/app/workers/import",
      action: metrics.activeWorkerCount ? "Review workers" : "Import workers",
      complete: metrics.activeWorkerCount > 0,
    },
    {
      key: "attendance",
      title: "Complete the first attendance submission",
      description: "Schedule a service, assign expected departments, and submit the first department attendance record.",
      href: "/app/service-days",
      action: "Open service-day control",
      complete: metrics.attendanceSubmissionCount > 0,
    },
  ];
}

export function onboardingProgress(steps: OnboardingStep[]) {
  const completed = steps.filter((step) => step.complete).length;
  return {
    completed,
    total: steps.length,
    percentage: steps.length ? Math.round((completed / steps.length) * 100) : 0,
  };
}
