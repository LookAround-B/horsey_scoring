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
  addRidersToEvent,
  deleteRider,
  type RiderInput,
  addParticipant,
  removeParticipant,
  setEventSheets,
  saveSheetRiders,
  deleteEvent,
  getEventById,
  createGuidelineTemplate,
  deleteGuidelineTemplate,
  type EventStatus,
} from "@/lib/events";
import {
  parseAction,
  createEventSchema,
  eventMetaSchema,
  addRiderSchema,
  guidelineTemplateSchema,
} from "@/lib/validation";

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

export async function createFullEventAction(
  formData: FormData
): Promise<{ id?: string; error?: string }> {
  try {
    const u = await requireCreator();
    const parsed = parseAction(createEventSchema, {
      name: formData.get("name"),
      location: formData.get("location"),
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
      startTime: formData.get("startTime") || null,
      endTime: formData.get("endTime") || null,
      guidelines: formData.get("guidelines") || null,
      secretaryId: formData.get("secretaryId"),
    });
    if (parsed.error) return { error: parsed.error };
    const data = parsed.parsed!;
    const secretaryId =
      u.role === "super_admin" ? data.secretaryId || u.id : u.id;

    const id = await createFullEvent(
      {
        name: data.name,
        location: data.location,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        guidelines: data.guidelines ?? null,
        secretaryId,
      },
      u.id
    );
    const slugs = formData.getAll("slug").map(String);
    if (slugs.length) await setEventSheets(id, slugs);

    revalidatePath("/dashboard/admin/events");
    return { id };
  } catch {
    return { error: "Failed to create event." };
  }
}

export async function updateEventMetaAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  try {
    const eventId = String(formData.get("eventId") ?? "");
    await requireEventManager(eventId);
    const parsed = parseAction(eventMetaSchema, {
      eventId,
      name: formData.get("name"),
      location: formData.get("location"),
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
      startTime: formData.get("startTime") || null,
      endTime: formData.get("endTime") || null,
      guidelines: formData.get("guidelines") || null,
      status: formData.get("status") || undefined,
    });
    if (parsed.error) return { error: parsed.error };
    const d = parsed.parsed!;
    await updateEventMeta(eventId, {
      name: d.name,
      location: d.location,
      startDate: d.startDate ?? null,
      endDate: d.endDate ?? null,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
      guidelines: d.guidelines ?? null,
      status: d.status as EventStatus | undefined,
    });
    revalidatePath(`/dashboard/admin/events/${eventId}`);
    return { ok: true };
  } catch {
    return { error: "Failed to save details." };
  }
}

export async function saveGuidelineTemplateAction(
  title: string,
  body: string
): Promise<{ ok?: boolean; error?: string }> {
  const u = await requireCreator();
  const parsed = parseAction(guidelineTemplateSchema, { title, body });
  if (parsed.error) return { error: parsed.error };
  await createGuidelineTemplate(parsed.parsed!.title, parsed.parsed!.body, u.id);
  revalidatePath("/dashboard/admin/events");
  return { ok: true };
}

export async function deleteGuidelineTemplateAction(formData: FormData) {
  await requireCreator();
  await deleteGuidelineTemplate(String(formData.get("templateId") ?? ""));
  revalidatePath("/dashboard/admin/events");
}

export async function setVisibilityAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  try {
    const id = String(formData.get("eventId") ?? "");
    await requireEventManager(id);
    await setEventVisibility(id, {
      riders: formData.get("riders") === "on",
      scores: formData.get("scores") === "on",
      judges: formData.get("judges") === "on",
      secretary: formData.get("secretary") === "on",
    });
    revalidatePath(`/dashboard/admin/events/${id}`);
    return { ok: true };
  } catch {
    return { error: "Failed to save permissions." };
  }
}

export async function setTimerConfigAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  try {
    const id = String(formData.get("eventId") ?? "");
    await requireEventManager(id);
    const dressage = parseInt(String(formData.get("dressSec") ?? "")) || undefined;
    const showjumping = parseInt(String(formData.get("sjSec") ?? "")) || undefined;
    await setEventTimerConfig(id, { dressage, showjumping });
    revalidatePath(`/dashboard/admin/events/${id}`);
    return { ok: true };
  } catch {
    return { error: "Failed to save timer config." };
  }
}

export async function regenerateCodeAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await regenerateAccessCode(id);
  revalidatePath(`/dashboard/admin/events/${id}`);
}

export async function addRiderAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  await requireEventManager(eventId);
  const parsed = parseAction(addRiderSchema, {
    eventId,
    name: formData.get("name"),
    nf: formData.get("nf"),
    competitorNo: formData.get("competitorNo"),
    horse: formData.get("horse"),
    horseNo: formData.get("horseNo"),
    imageUrl: formData.get("imageUrl"),
  });
  if (parsed.error) return;
  const d = parsed.parsed!;
  await addRider(eventId, {
    name: d.name,
    nf: d.nf,
    competitorNo: d.competitorNo,
    horse: d.horse,
    horseNo: d.horseNo,
    imageUrl: d.imageUrl,
  });
  revalidatePath(`/dashboard/admin/events/${eventId}`);
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
  const eventId = String(formData.get("eventId") ?? "");
  await requireEventManager(eventId);
  await deleteRider(eventId, String(formData.get("riderId") ?? ""));
  revalidatePath(`/dashboard/admin/events/${eventId}`);
}

export async function addExistingRidersAction(
  eventId: string,
  riderIds: string[]
): Promise<{ count?: number; error?: string }> {
  try {
    await requireEventManager(eventId);
    if (!riderIds?.length) return { error: "No riders selected." };
    const count = await addRidersToEvent(eventId, riderIds);
    revalidatePath(`/dashboard/admin/events/${eventId}`);
    return { count };
  } catch {
    return { error: "Failed to add riders." };
  }
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

export async function saveEventSheetsAction(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const id = String(formData.get("eventId") ?? "");
    await requireEventManager(id);
    await setEventSheets(id, formData.getAll("slug").map(String));
    revalidatePath(`/dashboard/admin/events/${id}`);
    return { ok: true };
  } catch {
    return { error: "Failed to save sheets." };
  }
}

export async function saveSheetRidersAction(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const id = String(formData.get("eventId") ?? "");
    const slug = String(formData.get("testSlug") ?? "");
    if (!id || !slug) return { error: "Missing event or sheet." };
    await requireEventManager(id);
    await saveSheetRiders(id, slug, formData.getAll("riderId").map(String));
    revalidatePath(`/dashboard/admin/events/${id}`);
    return { ok: true };
  } catch {
    return { error: "Failed to save riders." };
  }
}

export async function deleteEventAction(formData: FormData) {
  const id = String(formData.get("eventId") ?? "");
  await requireEventManager(id);
  await deleteEvent(id);
  revalidatePath("/dashboard/admin/events");
  redirect("/dashboard/admin/events");
}
