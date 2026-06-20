"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createUserByAdmin } from "@/lib/users";
import { parseAction, createUserSchema } from "@/lib/validation";

export async function createUserAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const s = await auth();
  if (s?.user?.role !== "super_admin" || s.user.status !== "approved") redirect("/dashboard");

  const parsed = parseAction(createUserSchema, {
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (parsed.error) return { error: parsed.error };
  const { email, name, role, password } = parsed.parsed!;

  const res = await createUserByAdmin({
    email: email.toLowerCase(),
    name,
    role,
    password,
    approvedBy: s.user.id,
  });
  if (res.error) return { error: res.error };

  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}
