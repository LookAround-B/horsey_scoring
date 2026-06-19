import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QualityMarkingSheetBuilder } from "./QualityMarkingSheetBuilder";

export const dynamic = "force-dynamic";

export default async function AddQualitySheetPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  return <QualityMarkingSheetBuilder />;
}
