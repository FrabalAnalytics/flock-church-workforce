export type ServiceExpectationSnapshot = {
  department_id: string;
  department_name: string;
  last_reminded_at: string | null;
};

export type ServiceActionSnapshot = {
  id: string;
  service_type: string;
  service_date: string;
  attendance_status: "open" | "closed";
  expectations: ServiceExpectationSnapshot[];
  submitted_department_ids: string[];
};

export type MissingAttendanceAction = ServiceExpectationSnapshot & {
  key: string;
  service_id: string;
  service_type: string;
  service_date: string;
  attendance_status: "open" | "closed";
};

export function findMissingAttendanceActions(
  services: ServiceActionSnapshot[],
  departmentId?: string | null,
): MissingAttendanceAction[] {
  return services.flatMap((service) => {
    const submitted = new Set(service.submitted_department_ids);
    return service.expectations
      .filter((expectation) => !departmentId || expectation.department_id === departmentId)
      .filter((expectation) => !submitted.has(expectation.department_id))
      .map((expectation) => ({
        ...expectation,
        key: `${service.id}:${expectation.department_id}`,
        service_id: service.id,
        service_type: service.service_type,
        service_date: service.service_date,
        attendance_status: service.attendance_status,
      }));
  });
}
