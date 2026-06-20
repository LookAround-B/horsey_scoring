import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Pen } from "lucide-react";
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
        icon: Pen,
        label: "Dressage Writer Panel",
        discipline: "dressage",
        description:
          "Transcribe the judge's verbal scores in real time during each test. Open the scoring sheet for the current rider and enter marks as the judge calls them. Scores are shared immediately with the show secretary.",
        sheetAction: "Write",
        emptyHint:
          "Your show secretary will send you an access code. Use 'Join Event' to get added to your assigned competition.",
      }}
    />
  );
}
