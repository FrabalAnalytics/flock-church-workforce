export type WorkerAttendanceRecord = {
  status: "Present" | "Absent";
};

export function summarizeWorkerAttendance(records: WorkerAttendanceRecord[]) {
  const present = records.filter((record) => record.status === "Present").length;
  const absent = records.length - present;

  return {
    total: records.length,
    present,
    absent,
    rate: records.length ? Math.round((present / records.length) * 100) : 0,
  };
}
