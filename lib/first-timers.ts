export const firstTimerStages = [
  "new",
  "assigned",
  "contacted",
  "follow_up",
  "returned",
  "connected",
  "integrated",
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
  integrated: "Integrated",
  closed: "Closed",
};

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
