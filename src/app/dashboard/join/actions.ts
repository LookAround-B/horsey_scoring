"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { joinByCode } from "@/lib/events";

export async function joinByCodeAction(formData: FormData): Promise<{ error?: string }> {
  const s = await auth();
  if (!s?.user || s.user.status !== "approved") redirect("/dashboard");

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter an event code." };

  const res = await joinByCode(s.user.id, code);
  if ("error" in res) return { error: res.error };

  redirect(`/dashboard/events/${res.eventId}`);
}
