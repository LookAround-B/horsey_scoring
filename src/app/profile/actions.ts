"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateProfile, getProfileFieldConfig } from "@/lib/users";

export async function updateProfileAction(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const s = await auth();
  if (!s?.user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim();
  const signature = String(formData.get("signature") ?? "").trim();

  if (!name) return { error: "Name is required." };

  const cfg = await getProfileFieldConfig();
  if (cfg.phone && !phone) return { error: "Phone number is required." };
  if (cfg.image_url && !image_url) return { error: "Profile image URL is required." };
  if (cfg.signature && !signature) return { error: "E-signature is required." };

  await updateProfile(s.user.id, { name, phone, image_url, signature });
  return { ok: true };
}
