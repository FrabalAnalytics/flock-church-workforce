export type AttendanceDraft = {
  version: 1;
  serviceType: string;
  presentWorkerIds: string[];
  updatedAt: string;
};

export function createAttendanceDraft(
  serviceType: string,
  presentWorkerIds: Iterable<string>,
  updatedAt = new Date().toISOString(),
): AttendanceDraft {
  return {
    version: 1,
    serviceType,
    presentWorkerIds: [...new Set(presentWorkerIds)].sort(),
    updatedAt,
  };
}

export function parseAttendanceDraft(
  raw: string,
  options: {
    allowedWorkerIds: Set<string>;
    allowedServiceTypes: Set<string>;
    latestSubmissionByService: Record<string, string>;
  },
): AttendanceDraft | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || typeof record.serviceType !== "string" || typeof record.updatedAt !== "string") return null;
  if (!Array.isArray(record.presentWorkerIds) || record.presentWorkerIds.length > 5000) return null;
  if (Number.isNaN(Date.parse(record.updatedAt))) return null;

  const serviceType = options.allowedServiceTypes.has(record.serviceType) ? record.serviceType : "";
  const presentWorkerIds = [...new Set(
    record.presentWorkerIds.filter(
      (id): id is string => typeof id === "string" && options.allowedWorkerIds.has(id),
    ),
  )].sort();

  if (serviceType) {
    const latestSubmission = options.latestSubmissionByService[serviceType];
    if (latestSubmission && Date.parse(latestSubmission) >= Date.parse(record.updatedAt)) return null;
  }

  if (!serviceType && !presentWorkerIds.length) return null;
  return {
    version: 1,
    serviceType,
    presentWorkerIds,
    updatedAt: record.updatedAt,
  };
}
