"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createEvent, deleteEvent, setEventSheets } from "@/lib/events";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "");
  if (!name.trim()) return;
  await createEvent(name);
  revalidatePath("/dashboard/admin/events");
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  await deleteEvent(id);
  revalidatePath("/dashboard/admin/events");
}

export async function saveEventSheetsAction(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  const slugs = formData.getAll("slug").map(String);
  await setEventSheets(eventId, slugs);
  revalidatePath("/dashboard/admin/events");
}
