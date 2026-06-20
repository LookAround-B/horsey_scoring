"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { setUserApproval, rejectUser } from "@/lib/users";
import { parseAction, approveSchema, rejectSchema } from "@/lib/validation";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  return session.user.id;
}

export async function approveAction(formData: FormData) {
  const adminId = await requireAdmin();
  const parsed = parseAction(approveSchema, {
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (parsed.error) return;
  const { userId, role } = parsed.parsed!;
  await setUserApproval(userId, role, adminId);
  revalidatePath("/dashboard/admin/approvals");
}

export async function rejectAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseAction(rejectSchema, { userId: formData.get("userId") });
  if (parsed.error) return;
  await rejectUser(parsed.parsed!.userId);
  revalidatePath("/dashboard/admin/approvals");
}
