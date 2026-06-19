"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createUserByAdmin } from "@/lib/users";
import { ASSIGNABLE_ROLES, type UserRole } from "@/lib/roles";

export async function createUserAction(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const s = await auth();
  if (s?.user?.role !== "super_admin" || s.user.status !== "approved") redirect("/dashboard");

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;
  const password = String(formData.get("password") ?? "");

  if (!email || !name) return { error: "Name and email are required." };
  if (!ASSIGNABLE_ROLES.includes(role) && role !== "super_admin") return { error: "Pick a valid role." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const res = await createUserByAdmin({ email, name, role, password, approvedBy: s.user.id });
  if (res.error) return { error: res.error };

  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}
