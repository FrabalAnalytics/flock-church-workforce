export const firstTimerStages = [
  "new",
  "assigned",
  "contacted",
  "follow_up",
  "returned",
  "connected",
  "membership_training",
  "member",
  "closed",
] as const;

export type FirstTimerStage = (typeof firstTimerStages)[number];

export const firstTimerStageLabels: Record<FirstTimerStage, string> = {
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

export const membershipTrainingStatuses = ["not_started", "in_progress", "completed"] as const;
export type MembershipTrainingStatus = (typeof membershipTrainingStatuses)[number];

export const membershipTrainingStatusLabels: Record<MembershipTrainingStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export function validateMembershipTrainingUpdate(input: {
  status: string;
  startedAt: string;
  completedAt: string;
  notes: string;
}) {
  if (!membershipTrainingStatuses.includes(input.status as MembershipTrainingStatus)) {
    return "Select a valid membership training status.";
  }

  const status = input.status as MembershipTrainingStatus;
  const startedAt = input.startedAt || null;
  const completedAt = input.completedAt || null;
  const notes = input.notes.trim() || null;
  const validDate = (date: string | null) => !date || /^\d{4}-\d{2}-\d{2}$/.test(date);

  if (!validDate(startedAt) || !validDate(completedAt)) return "Enter valid membership training dates.";
  if (notes && notes.length > 500) return "Membership training notes cannot exceed 500 characters.";
  if (status === "not_started" && (startedAt || completedAt)) return "Clear the training dates when training has not started.";
  if (status === "in_progress" && (!startedAt || completedAt)) return "Enter the training start date and leave the completion date blank.";
  if (status === "completed" && (!startedAt || !completedAt)) return "Enter both the training start and completion dates.";
  if (startedAt && completedAt && completedAt < startedAt) return "Training completion cannot be earlier than the start date.";

  return { status, startedAt, completedAt, notes };
}

export const serviceTypes = [
  "Sunday Service",
  "Tuesday Service",
  "Special Service",
  "Headquarters Service",
  "Tarry Night",
] as const;

export const preferredContactMethods = ["phone", "whatsapp", "sms", "email", "none"] as const;
export const interactionTypes = ["call", "whatsapp", "sms", "email", "visit", "note"] as const;

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function validateFirstTimerRegistration(input: {
  fullName: string;
  phoneNumber: string;
  email: string;
  preferredContact: string;
  consentToContact: boolean;
  firstVisitDate: string;
  firstServiceType: string;
}) {
  const fullName = input.fullName.trim();
  const phoneNumber = input.phoneNumber.trim();
  const phoneNumberNormalized = normalizePhoneNumber(phoneNumber);
  const email = input.email.trim().toLowerCase() || null;
  const preferredContact = input.consentToContact ? input.preferredContact : "none";

  if (fullName.length < 2 || fullName.length > 120) return "Enter a full name containing 2–120 characters.";
  if (phoneNumber.length > 40 || phoneNumberNormalized.length < 7 || phoneNumberNormalized.length > 20) return "Enter a valid phone number.";
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) return "Enter a valid email address or leave it blank.";
  if (!preferredContactMethods.includes(preferredContact as (typeof preferredContactMethods)[number])) return "Select a valid contact preference.";
  if (input.consentToContact && preferredContact === "none") return "Select how the visitor prefers to be contacted.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.firstVisitDate)) return "Select the visitor's first visit date.";
  if (!serviceTypes.includes(input.firstServiceType as (typeof serviceTypes)[number])) return "Select a valid service type.";

  return {
    fullName,
    phoneNumber,
    phoneNumberNormalized,
    email,
    preferredContact,
  };
}
