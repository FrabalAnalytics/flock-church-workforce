export type ImportDepartment = { id: string; name: string };

export type WorkerImportPayload = {
  full_name: string;
  phone_number: string;
  sex: string;
  department_id: string;
  status: string;
  joined_at: string;
  whatsapp_opt_in: boolean;
};

export type WorkerImportPreviewRow = {
  rowNumber: number;
  fullName: string;
  phoneNumber: string;
  departmentName: string;
  status: string;
  payload: WorkerImportPayload | null;
  errors: string[];
  duplicate: boolean;
};

const requiredHeaders = ["full_name", "department"];
const acceptedHeaders = new Set(["full_name", "phone_number", "sex", "department", "status", "joined_at", "whatsapp_opt_in"]);

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field.replace(/\r$/, ""));
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "active") return "Active";
  if (normalized === "inactive") return "Inactive";
  if (normalized === "on leave" || normalized === "on_leave") return "On Leave";
  return null;
}

function normalizeSex(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  return null;
}

function normalizeConsent(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || ["false", "no", "0"].includes(normalized)) return false;
  if (["true", "yes", "1"].includes(normalized)) return true;
  return null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateWorkerImport(text: string, departments: ImportDepartment[], today: string): WorkerImportPreviewRow[] {
  const parsed = parseCsv(text);
  if (parsed.length < 2) throw new Error("The CSV must contain a header row and at least one worker.");
  const headers = parsed[0].map(normalizeHeader);
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing required ${missing.length === 1 ? "column" : "columns"}: ${missing.join(", ")}.`);
  if (new Set(headers).size !== headers.length) throw new Error("The CSV contains duplicate column headings.");
  const unknown = headers.filter((header) => !acceptedHeaders.has(header));
  if (unknown.length) throw new Error(`Unknown ${unknown.length === 1 ? "column" : "columns"}: ${unknown.join(", ")}.`);
  const dataRows = parsed.slice(1);
  if (dataRows.length > 500) throw new Error("Import no more than 500 workers at a time.");

  const departmentsByName = new Map(departments.map((department) => [department.name.trim().toLowerCase(), department]));
  const seen = new Set<string>();
  return dataRows.map((values, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column]?.trim() ?? ""]));
    const errors: string[] = [];
    if (values.length !== headers.length) errors.push(`Expected ${headers.length} columns but found ${values.length}.`);
    const fullName = record.full_name;
    const phoneNumber = record.phone_number ?? "";
    const departmentName = record.department;
    const department = departmentsByName.get(departmentName.toLowerCase());
    const sex = normalizeSex(record.sex ?? "");
    const status = normalizeStatus(record.status ?? "");
    const joinedAt = record.joined_at || today;
    const consent = normalizeConsent(record.whatsapp_opt_in ?? "");
    if (fullName.length < 2 || fullName.length > 120) errors.push("Full name must contain 2–120 characters.");
    if (phoneNumber.length > 40) errors.push("Phone number cannot exceed 40 characters.");
    if (!department) errors.push(`Department “${departmentName || "blank"}” does not match the directory.`);
    if (sex === null) errors.push("Sex must be Male, Female, or blank.");
    if (status === null) errors.push("Status must be Active, Inactive, or On Leave.");
    if (!isValidDate(joinedAt) || joinedAt > today) errors.push("Joined date must be a valid date that is not in the future.");
    if (consent === null) errors.push("WhatsApp consent must be Yes, No, True, False, 1, 0, or blank.");
    if (consent === true && !phoneNumber) errors.push("A phone number is required when WhatsApp consent is Yes.");
    const duplicateKey = department ? `${department.id}:${fullName.toLowerCase()}` : "";
    const duplicate = Boolean(duplicateKey && seen.has(duplicateKey));
    if (duplicateKey) seen.add(duplicateKey);
    return {
      rowNumber: index + 2,
      fullName,
      phoneNumber,
      departmentName,
      status: status ?? record.status ?? "",
      errors,
      duplicate,
      payload: errors.length || !department || sex === null || status === null || consent === null ? null : {
        full_name: fullName,
        phone_number: phoneNumber,
        sex,
        department_id: department.id,
        status,
        joined_at: joinedAt,
        whatsapp_opt_in: consent,
      },
    };
  });
}
