export type InvitationRole = "super_admin" | "church_leader" | "department_head";

export type InvitationInput = {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: InvitationRole;
  departmentId: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invitationRoles = new Set<InvitationRole>(["super_admin", "church_leader", "department_head"]);

export function validateInvitationInput(input: {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  departmentId: string;
}): { value: InvitationInput; error: null } | { value: null; error: string } {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phoneNumber = input.phoneNumber.trim() || null;
  const departmentId = input.departmentId.trim() || null;

  if (fullName.length < 2 || fullName.length > 120) {
    return { value: null, error: "Enter a full name containing 2–120 characters." };
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return { value: null, error: "Enter a valid email address." };
  }
  if (phoneNumber && phoneNumber.length > 40) {
    return { value: null, error: "Phone number cannot exceed 40 characters." };
  }
  if (!invitationRoles.has(input.role as InvitationRole)) {
    return { value: null, error: "Select a valid invited-user role." };
  }

  const role = input.role as InvitationRole;
  if (role === "department_head" && (!departmentId || !uuidPattern.test(departmentId))) {
    return { value: null, error: "Department Heads must be assigned a valid department." };
  }

  return {
    value: {
      fullName,
      email,
      phoneNumber,
      role,
      departmentId: role === "department_head" ? departmentId : null,
    },
    error: null,
  };
}
