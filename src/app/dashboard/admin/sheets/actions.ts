"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { setPlacement, type Discipline } from "@/lib/sheets";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  return session.user.id;
}

export async function setPlacementAction(slug: string, discipline: Discipline) {
  const adminId = await requireAdmin();
  if (!slug || (discipline !== "dressage" && discipline !== "showjumping")) return;
  await setPlacement(slug, discipline, adminId);
}
