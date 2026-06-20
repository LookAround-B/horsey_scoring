"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateProfile, getProfileFieldConfig } from "@/lib/users";
import { parseAction, profileSchema } from "@/lib/validation";

export async function updateProfileAction(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const s = await auth();
  if (!s?.user) redirect("/login");

  const parsed = parseAction(profileSchema, {
    name: formData.get("name"),
    phone: formData.get("phone"),
    image_url: formData.get("image_url"),
    signature: formData.get("signature"),
  });
  if (parsed.error) return { error: parsed.error };
  const { name, phone, image_url, signature } = parsed.parsed!;

  const cfg = await getProfileFieldConfig();
  if (cfg.phone && !phone) return { error: "Phone number is required." };
  if (cfg.image_url && !image_url) return { error: "Profile image URL is required." };
  if (cfg.signature && !signature) return { error: "E-signature is required." };

  await updateProfile(s.user.id, { name, phone, image_url, signature });
  return { ok: true };
}
