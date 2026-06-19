"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createFullEvent,
  updateEventMeta,
  setEventVisibility,
  regenerateAccessCode,
  addRider,
  deleteRider,
  addParticipant,
  removeParticipant,
  setEventSheets,
  deleteEvent,
  getEventById,
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
      secretaryId,
    },
    u.id
  );
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
    status: (String(formData.get("status") ?? "") as EventStatus) || undefined,
  });
  revalidatePath(`/dashboard/admin/events/${id}`);
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
