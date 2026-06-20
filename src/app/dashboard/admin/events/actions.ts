"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createFullEvent,
  updateEventMeta,
  setEventVisibility,
  setEventTimerConfig,
  regenerateAccessCode,
  addRider,
  addRidersBulk,
  deleteRider,
  type RiderInput,
  addParticipant,
  removeParticipant,
  setEventSheets,
  deleteEvent,
  getEventById,
  createGuidelineTemplate,
  deleteGuidelineTemplate,
  type EventStatus,
} from "@/lib/events";

async function session() {
  const s = await auth();
  if (!s?.user || s.user.status !== "approved") redirect("/dashboard");
  return s.user;
}

/** Super admin, or the show secretary, may create/list events. */
async function requireCreator() {
  const u = await session();
  if (u.role !== "super_admin" && u.role !== "show_secretary") redirect("/dashboard");
  return u;
}

/** Super admin or the secretary who owns this event may manage it. */
async function requireEventManager(eventId: string) {
  const u = await session();
  if (u.role === "super_admin") return u;
  const ev = await getEventById(eventId);
  if (!ev || ev.secretary_id !== u.id) redirect("/dashboard");
  return u;
}

export async function createFullEventAction(formData: FormData) {
  const u = await requireCreator();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  // Secretaries own their own events; super admin may assign one.
  const secretaryId =
    u.role === "super_admin" ? String(formData.get("secretaryId") ?? "") || u.id : u.id;

  const id = await createFullEvent(
    {
      name,
      location: String(formData.get("location") ?? ""),
      startDate: String(formData.get("startDate") ?? "") || null,
      endDate: String(formData.get("endDate") ?? "") || null,
      startTime: String(formData.get("startTime") ?? "") || null,
      endTime: String(formData.get("endTime") ?? "") || null,
      guidelines: String(formData.get("guidelines") ?? "") || null,
      secretaryId,
    },
    u.id
  );
  // Sheets chosen at creation time.
  const slugs = formData.getAll("slug").map(String);
  if (slugs.length) await setEventSheets(id, slugs);

  revalidatePath("/dashboard/admin/events");
  redirect(`/dashboard/admin/events/${id}`);
}

export async function updateEventMetaAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await updateEventMeta(id, {
    name: String(formData.get("name") ?? ""),
    location: String(formData.get("location") ?? ""),
    startDate: String(formData.get("startDate") ?? "") || null,
    endDate: String(formData.get("endDate") ?? "") || null,
    startTime: String(formData.get("startTime") ?? "") || null,
    endTime: String(formData.get("endTime") ?? "") || null,
    guidelines: String(formData.get("guidelines") ?? "") || null,
    status: (String(formData.get("status") ?? "") as EventStatus) || undefined,
  });
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function saveGuidelineTemplateAction(
  title: string,
  body: string
): Promise<{ ok?: boolean; error?: string }> {
  const u = await requireCreator();
  if (!title.trim()) return { error: "Give the template a title." };
  if (!body.trim()) return { error: "Guidelines are empty." };
  await createGuidelineTemplate(title, body, u.id);
  revalidatePath("/dashboard/admin/events");
  return { ok: true };
}

export async function deleteGuidelineTemplateAction(formData: FormData) {
  await requireCreator();
  await deleteGuidelineTemplate(String(formData.get("templateId") ?? ""));
  revalidatePath("/dashboard/admin/events");
}

export async function setVisibilityAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await setEventVisibility(id, {
    riders: formData.get("riders") === "on",
    scores: formData.get("scores") === "on",
    judges: formData.get("judges") === "on",
    secretary: formData.get("secretary") === "on",
  });
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function setTimerConfigAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  const dressage = parseInt(String(formData.get("dressSec") ?? "")) || undefined;
  const showjumping = parseInt(String(formData.get("sjSec") ?? "")) || undefined;
  await setEventTimerConfig(id, { dressage, showjumping });
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function regenerateCodeAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await regenerateAccessCode(id);
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function addRiderAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await addRider(id, {
    name,
    nf: String(formData.get("nf") ?? ""),
    competitorNo: String(formData.get("competitorNo") ?? ""),
    horse: String(formData.get("horse") ?? ""),
    horseNo: String(formData.get("horseNo") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
  });
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function importRidersAction(
  eventId: string,
  riders: RiderInput[]
): Promise<{ count?: number; error?: string }> {
  await requireEventManager(eventId);
  if (!riders?.length) return { error: "Nothing to import." };
  const count = await addRidersBulk(eventId, riders);
  revalidatePath(`/dashboard/admin/events/${eventId}`);
  return { count };
}

export async function deleteRiderAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await deleteRider(String(formData.get("riderId") ?? ""));
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function addParticipantAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  const userId = String(formData.get("userId") ?? "");
  const roleAtEvent = String(formData.get("roleAtEvent") ?? "");
  if (!userId) return;
  await addParticipant(id, userId, roleAtEvent);
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function removeParticipantAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await removeParticipant(String(formData.get("participantId") ?? ""));
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function saveEventSheetsAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await setEventSheets(id, formData.getAll("slug").map(String));
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function deleteEventAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await deleteEvent(id);
  revalidatePath("/dashboard/admin/events");
  redirect("/dashboard/admin/events");
}
