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
        label: "Dressage Judge Panel",
        discipline: "dressage",
        description: "Open a scoring sheet for each rider in your assigned event. Score each movement 0-10, enter collective marks, then submit. Your scores are shared in real time with the show secretary.",
        sheetAction: "Score",
        emptyHint: "Your show secretary will send you an access code. Use 'Join Event' to get added to your assigned competition.",
      }}
    />
  );
}
