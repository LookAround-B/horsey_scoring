import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Eye } from "lucide-react";
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
        icon: Eye,
        label: "Examiner Panel",
        discipline: "all",
        description:
          "Review and examine riders in your assigned events. Open the relevant sheet to record your assessment and submit your findings to the show secretary.",
        sheetAction: "Examine",
        emptyHint:
          "Your show secretary will send you an access code. Use 'Join Event' to get added to your assigned event.",
      }}
    />
  );
}
