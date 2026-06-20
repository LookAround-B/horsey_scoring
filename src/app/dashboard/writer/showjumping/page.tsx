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
        label: "Show Jumping Writer Panel",
        discipline: "showjumping",
        description:
          "Record obstacle faults and times as called by the judge during the jumping phase. Open the class sheet and mark each rail down as the round progresses.",
        sheetAction: "Record",
        emptyHint:
          "Your show secretary will send you an access code. Use 'Join Event' to get added to your assigned competition.",
      }}
    />
  );
}
