"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { joinByCode } from "@/lib/events";
import { parseAction, joinCodeSchema } from "@/lib/validation";

export async function joinByCodeAction(formData: FormData): Promise<{ error?: string }> {
  const s = await auth();
  if (!s?.user || s.user.status !== "approved") redirect("/dashboard");

  const parsed = parseAction(joinCodeSchema, { code: formData.get("code") });
  if (parsed.error) return { error: parsed.error };

  const res = await joinByCode(s.user.id, parsed.parsed!.code);
  if ("error" in res) return { error: res.error };

  redirect(`/dashboard/events/${res.eventId}`);
}
