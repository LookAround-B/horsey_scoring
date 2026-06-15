"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { setUserApproval, rejectUser } from "@/lib/users";
import { ASSIGNABLE_ROLES, type UserRole } from "@/lib/roles";

// No RLS on a plain Postgres → every mutation must verify the caller is an admin.
async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  return session.user.id;
}

export async function approveAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!id || !ASSIGNABLE_ROLES.includes(role)) return;
  await setUserApproval(id, role, adminId);
  revalidatePath("/dashboard/admin/approvals");
}

export async function rejectAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  if (!id) return;
  await rejectUser(id);
  revalidatePath("/dashboard/admin/approvals");
}
