export const reportServiceTypes = new Set([
  "Sunday Service",
  "Tuesday Service",
  "Special Service",
  "Headquarters Service",
  "Tarry Night",
]);

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseReportFilters(requestUrl: string) {
  const params = new URL(requestUrl).searchParams;
  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 89);
  const from = params.get("from") || isoDate(defaultFrom);
  const to = params.get("to") || isoDate(today);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { error: "Use valid report dates." } as const;
  }
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const days = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (!Number.isFinite(days) || days < 1 || days > 730) {
    return { error: "Choose a report period between 1 and 730 days." } as const;
  }
  const serviceValue = params.get("service");
  const service = serviceValue && reportServiceTypes.has(serviceValue) ? serviceValue : null;
  if (serviceValue && !service) return { error: "Choose a valid service type." } as const;
  const department = params.get("department");
  if (department && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(department)) {
    return { error: "Choose a valid department." } as const;
  }
  return { from, to, service, department } as const;
}

export function reportPeriod(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${from}T00:00:00Z`))} - ${formatter.format(new Date(`${to}T00:00:00Z`))}`;
}
