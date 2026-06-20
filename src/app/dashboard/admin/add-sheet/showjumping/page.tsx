import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ShowJumpingSheetBuilder } from "./ShowJumpingSheetBuilder";

export const dynamic = "force-dynamic";

export default async function AddShowJumpingPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  return <ShowJumpingSheetBuilder />;
}
