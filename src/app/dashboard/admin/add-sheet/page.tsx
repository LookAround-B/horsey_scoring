import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FilePlus2, ChevronRight, Trophy, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AddSheetPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <FilePlus2 className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">Add scoring sheet</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Choose the type of scoring sheet to create.</p>

      <div className="space-y-3">
        <Link
          href="/dashboard/admin/add-sheet/dressage"
          className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium">Add dressage scoring sheet</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Fixed columns (No, Letters, Movement, Directive, Coefficient); enter the rows.
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/dashboard/admin/add-sheet/quality"
          className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium">Add dressage quality marking sheet</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Assessment · Commentary · Mark rows; quality % combined with technical score.
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/dashboard/admin/add-sheet/showjumping"
          className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium">Add show jumping scoring sheet</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Set obstacle columns (name + type) and starting rider rows.
              Multi-rider rounds grid; set obstacle columns and rows.
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      </div>
    </div>
  );
}
