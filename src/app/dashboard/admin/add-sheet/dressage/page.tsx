import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DressageSheetBuilder } from "./DressageSheetBuilder";

export const dynamic = "force-dynamic";

export default async function AddDressageSheetPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  return <DressageSheetBuilder />;
}
