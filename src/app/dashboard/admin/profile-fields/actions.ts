"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { setProfileFieldRequired, type ProfileFields } from "@/lib/users";

export async function setProfileFieldsAction(formData: FormData) {
  const s = await auth();
  if (s?.user?.role !== "super_admin" || s.user.status !== "approved") redirect("/dashboard");

  const fields: ProfileFields[] = ["phone", "image_url", "signature"];
  for (const f of fields) {
    await setProfileFieldRequired(f, formData.get(f) === "on");
  }
  revalidatePath("/dashboard/admin/profile-fields");
}
