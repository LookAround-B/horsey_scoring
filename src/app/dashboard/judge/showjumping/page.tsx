import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ClipboardCheck } from "lucide-react";
import { OfficialPanel } from "@/app/dashboard/_panels/OfficialPanel";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");

  return (
    <OfficialPanel
      userId={user.id}
      config={{
        icon: ClipboardCheck,
        label: "Show Jumping Judge Panel",
        discipline: "showjumping",
        description:
          "Record obstacle faults and jumping times for each round. Use the built-in stopwatch to time riders. Submit the sheet when the class is complete.",
        sheetAction: "Open sheet",
        emptyHint:
          "Your show secretary will send you an access code. Use 'Join Event' to get added to your assigned competition.",
      }}
    />
  );
}
