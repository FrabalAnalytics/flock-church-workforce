"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  firstTimerStages,
  interactionTypes,
  normalizePhoneNumber,
  preferredContactMethods,
  serviceTypes,
  validateFirstTimerRegistration,
  validateMembershipTrainingUpdate,
} from "@/lib/first-timers";
import { createClient } from "@/lib/supabase/server";

const managerRoles = new Set(["super_admin", "church_leader", "first_timer_coordinator"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateFirstTimerContact(formData: FormData) {
  await requireFirstTimerManager();
  const id = value(formData, "first_timer_id");
  const fullName = value(formData, "full_name");
  const phoneNumber = value(formData, "phone_number");
  const phoneNumberNormalized = normalizePhoneNumber(phoneNumber);
  const email = value(formData, "email").toLowerCase() || null;
  const consentToContact = formData.get("consent_to_contact") === "on";
  const preferredContact = consentToContact ? value(formData, "preferred_contact") : "none";
  if (!uuidPattern.test(id) || fullName.length < 2 || fullName.length > 120) redirect(destination("/app/first-timers", "error", "Enter valid first-timer details."));
  if (phoneNumber.length > 40 || phoneNumberNormalized.length < 7 || phoneNumberNormalized.length > 20) redirect(destination(`/app/first-timers/${id}`, "error", "Enter a valid phone number."));
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) redirect(destination(`/app/first-timers/${id}`, "error", "Enter a valid email address or leave it blank."));
  if (!preferredContactMethods.includes(preferredContact as (typeof preferredContactMethods)[number]) || (consentToContact && preferredContact === "none")) redirect(destination(`/app/first-timers/${id}`, "error", "Select a valid contact preference."));

  const supabase = await createClient();
  const { data: duplicate } = await supabase.from("first_timers").select("id, full_name").eq("phone_number_normalized", phoneNumberNormalized).neq("id", id).limit(1).maybeSingle();
  if (duplicate) redirect(destination(`/app/first-timers/${id}`, "error", `${duplicate.full_name} already uses this phone number.`));
  const { error } = await supabase.from("first_timers").update({
    full_name: fullName,
    phone_number: phoneNumber,
    phone_number_normalized: phoneNumberNormalized,
    email,
    preferred_contact: preferredContact,
    consent_to_contact: consentToContact,
    location: value(formData, "location") || null,
    how_heard: value(formData, "how_heard") || null,
    interests: value(formData, "interests") || null,
    next_followup_at: consentToContact ? undefined : null,
  }).eq("id", id);
  if (error) redirect(destination(`/app/first-timers/${id}`, "error", error.message));
  revalidatePath("/app/first-timers");
  revalidatePath(`/app/first-timers/${id}`);
  revalidatePath("/app/action-centre");
  redirect(destination(`/app/first-timers/${id}`, "message", "Contact details and consent updated."));
}

function destination(path: string, type: "message" | "error", text: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${new URLSearchParams({ [type]: text })}`;
}

async function requireFirstTimerManager() {
  const session = await requireProfile();
  if (!managerRoles.has(session.profile.role)) redirect("/app");
  return session;
}

function optionalDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

async function validCoordinator(id: string | null) {
  if (!id) return null;
  if (!uuidPattern.test(id)) return undefined;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("id", id).eq("role", "first_timer_coordinator").maybeSingle();
  return data?.id;
}

export async function registerFirstTimer(formData: FormData) {
  const { user } = await requireFirstTimerManager();
  const consentToContact = formData.get("consent_to_contact") === "on";
  const firstVisitDate = value(formData, "first_visit_date");
  const firstServiceType = value(formData, "first_service_type");
  const validated = validateFirstTimerRegistration({
    fullName: value(formData, "full_name"),
    phoneNumber: value(formData, "phone_number"),
    email: value(formData, "email"),
    preferredContact: value(formData, "preferred_contact"),
    consentToContact,
    firstVisitDate,
    firstServiceType,
  });
  if (typeof validated === "string") redirect(destination("/app/first-timers", "error", validated));

  const assignedToInput = value(formData, "assigned_to") || null;
  const assignedTo = await validCoordinator(assignedToInput);
  if (assignedToInput && !assignedTo) redirect(destination("/app/first-timers", "error", "Select a valid First Timers Coordinator."));
  const nextFollowupAt = optionalDateTime(value(formData, "next_followup_at"));
  if (nextFollowupAt === undefined) redirect(destination("/app/first-timers", "error", "Select a valid follow-up date and time."));
  if (!consentToContact && nextFollowupAt) redirect(destination("/app/first-timers", "error", "Follow-up cannot be scheduled without contact consent."));

  const supabase = await createClient();
  const { data: existing, error: duplicateError } = await supabase
    .from("first_timers")
    .select("id, full_name")
    .eq("phone_number_normalized", validated.phoneNumberNormalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (duplicateError) redirect(destination("/app/first-timers", "error", duplicateError.message));
  if (existing) redirect(destination(`/app/first-timers/${existing.id}`, "message", `${existing.full_name} already uses this phone number. Record a return visit or update the existing journey.`));

  const { data: firstTimer, error } = await supabase.from("first_timers").insert({
    full_name: validated.fullName,
    phone_number: validated.phoneNumber,
    phone_number_normalized: validated.phoneNumberNormalized,
    email: validated.email,
    preferred_contact: validated.preferredContact,
    consent_to_contact: consentToContact,
    consent_recorded_at: consentToContact ? new Date().toISOString() : null,
    first_visit_date: firstVisitDate,
    first_service_type: firstServiceType,
    location: value(formData, "location") || null,
    how_heard: value(formData, "how_heard") || null,
    interests: value(formData, "interests") || null,
    journey_stage: assignedTo ? "assigned" : "new",
    assigned_to: assignedTo,
    registered_by: user.id,
    next_followup_at: consentToContact ? nextFollowupAt : null,
  }).select("id").single();
  if (error || !firstTimer) redirect(destination("/app/first-timers", "error", error?.message ?? "The first timer could not be registered."));

  const { error: visitError } = await supabase.from("first_timer_visits").insert({
    first_timer_id: firstTimer.id,
    visit_date: firstVisitDate,
    service_type: firstServiceType,
    notes: "Initial registration",
    recorded_by: user.id,
  });
  if (visitError) redirect(destination(`/app/first-timers/${firstTimer.id}`, "error", `Registration saved, but the first visit could not be recorded: ${visitError.message}`));

  revalidatePath("/app/first-timers");
  revalidatePath("/app/action-centre");
  redirect(destination(`/app/first-timers/${firstTimer.id}`, "message", `${validated.fullName} was registered successfully.`));
}

export async function updateFirstTimerJourney(formData: FormData) {
  await requireFirstTimerManager();
  const id = value(formData, "first_timer_id");
  const stage = value(formData, "journey_stage");
  const assignedToInput = value(formData, "assigned_to") || null;
  const closedReason = value(formData, "closed_reason") || null;
  const nextFollowupAt = optionalDateTime(value(formData, "next_followup_at"));
  const training = validateMembershipTrainingUpdate({
    status: value(formData, "membership_training_status"),
    startedAt: value(formData, "membership_training_started_at"),
    completedAt: value(formData, "membership_training_completed_at"),
    notes: value(formData, "membership_training_notes"),
  });
  if (!uuidPattern.test(id) || !firstTimerStages.includes(stage as (typeof firstTimerStages)[number])) redirect(destination("/app/first-timers", "error", "Select a valid journey update."));
  if (stage === "closed" && (!closedReason || closedReason.length > 500)) redirect(destination(`/app/first-timers/${id}`, "error", "Enter a brief reason for closing this journey."));
  if (nextFollowupAt === undefined) redirect(destination(`/app/first-timers/${id}`, "error", "Select a valid next follow-up date."));
  if (typeof training === "string") redirect(destination(`/app/first-timers/${id}`, "error", training));
  if (stage === "member" && training.status !== "completed") redirect(destination(`/app/first-timers/${id}`, "error", "Membership training must be completed before this person can become a member."));
  const assignedTo = await validCoordinator(assignedToInput);
  if (assignedToInput && !assignedTo) redirect(destination(`/app/first-timers/${id}`, "error", "Select a valid First Timers Coordinator."));

  const supabase = await createClient();
  const { data: current, error: lookupError } = await supabase.from("first_timers").select("consent_to_contact").eq("id", id).maybeSingle();
  if (lookupError || !current) redirect(destination("/app/first-timers", "error", lookupError?.message ?? "First timer not found."));
  if (!current.consent_to_contact && nextFollowupAt) redirect(destination(`/app/first-timers/${id}`, "error", "Follow-up cannot be scheduled without contact consent."));
  const terminal = stage === "member" || stage === "closed";
  const { error } = await supabase.from("first_timers").update({
    journey_stage: stage,
    assigned_to: assignedTo,
    next_followup_at: terminal ? null : nextFollowupAt,
    closed_reason: stage === "closed" ? closedReason : null,
    membership_training_status: training.status,
    membership_training_started_at: training.startedAt,
    membership_training_completed_at: training.completedAt,
    membership_training_notes: training.notes,
  }).eq("id", id);
  if (error) redirect(destination(`/app/first-timers/${id}`, "error", error.message));
  revalidatePath("/app/first-timers");
  revalidatePath(`/app/first-timers/${id}`);
  revalidatePath("/app/action-centre");
  redirect(destination(`/app/first-timers/${id}`, "message", "Journey assignment and stage updated."));
}

export async function recordFirstTimerInteraction(formData: FormData) {
  const { user } = await requireFirstTimerManager();
  const id = value(formData, "first_timer_id");
  const interactionType = value(formData, "interaction_type");
  const outcome = value(formData, "outcome");
  const notes = value(formData, "notes") || null;
  const nextFollowupAt = optionalDateTime(value(formData, "next_followup_at"));
  if (!uuidPattern.test(id) || !interactionTypes.includes(interactionType as (typeof interactionTypes)[number])) redirect(destination("/app/first-timers", "error", "Select a valid interaction."));
  if (outcome.length < 2 || outcome.length > 240 || (notes && notes.length > 2000)) redirect(destination(`/app/first-timers/${id}`, "error", "Enter a short outcome and keep notes below 2,000 characters."));
  if (nextFollowupAt === undefined) redirect(destination(`/app/first-timers/${id}`, "error", "Select a valid next follow-up date."));

  const supabase = await createClient();
  const { data: person, error: lookupError } = await supabase.from("first_timers").select("consent_to_contact, journey_stage").eq("id", id).maybeSingle();
  if (lookupError || !person) redirect(destination("/app/first-timers", "error", lookupError?.message ?? "First timer not found."));
  if (!person.consent_to_contact && interactionType !== "note") redirect(destination(`/app/first-timers/${id}`, "error", "This person has not consented to follow-up contact. Only an internal note can be recorded."));

  const { error } = await supabase.from("first_timer_interactions").insert({
    first_timer_id: id,
    interaction_type: interactionType,
    outcome,
    notes,
    next_followup_at: nextFollowupAt,
    created_by: user.id,
  });
  if (error) redirect(destination(`/app/first-timers/${id}`, "error", error.message));

  const activeStage = !["membership_training", "member", "closed"].includes(person.journey_stage);
  const { error: updateError } = await supabase.from("first_timers").update({
    last_contacted_at: interactionType === "note" ? undefined : new Date().toISOString(),
    next_followup_at: nextFollowupAt,
    journey_stage: activeStage && interactionType !== "note" ? (nextFollowupAt ? "follow_up" : "contacted") : person.journey_stage,
  }).eq("id", id);
  if (updateError) redirect(destination(`/app/first-timers/${id}`, "error", `Interaction saved, but the journey summary could not be updated: ${updateError.message}`));
  revalidatePath("/app/first-timers");
  revalidatePath(`/app/first-timers/${id}`);
  revalidatePath("/app/action-centre");
  redirect(destination(`/app/first-timers/${id}`, "message", "Follow-up interaction recorded."));
}

export async function recordFirstTimerReturnVisit(formData: FormData) {
  const { user } = await requireFirstTimerManager();
  const id = value(formData, "first_timer_id");
  const visitDate = value(formData, "visit_date");
  const serviceType = value(formData, "service_type");
  const notes = value(formData, "notes") || null;
  if (!uuidPattern.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || !serviceTypes.includes(serviceType as (typeof serviceTypes)[number])) redirect(destination("/app/first-timers", "error", "Enter a valid return visit."));
  if (notes && notes.length > 500) redirect(destination(`/app/first-timers/${id}`, "error", "Return-visit notes cannot exceed 500 characters."));
  const supabase = await createClient();
  const { error } = await supabase.from("first_timer_visits").insert({ first_timer_id: id, visit_date: visitDate, service_type: serviceType, notes, recorded_by: user.id });
  if (error?.code === "23505") redirect(destination(`/app/first-timers/${id}`, "error", "That return visit has already been recorded."));
  if (error) redirect(destination(`/app/first-timers/${id}`, "error", error.message));
  const { data: person } = await supabase.from("first_timers").select("journey_stage").eq("id", id).maybeSingle();
  if (person && !["connected", "membership_training", "member", "closed"].includes(person.journey_stage)) {
    await supabase.from("first_timers").update({ journey_stage: "returned" }).eq("id", id);
  }
  revalidatePath("/app/first-timers");
  revalidatePath(`/app/first-timers/${id}`);
  redirect(destination(`/app/first-timers/${id}`, "message", "Return visit recorded."));
}
