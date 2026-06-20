"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { Clock, LogOut, RefreshCw } from "lucide-react";

export default function PendingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [checking, setChecking] = useState(false);

  const user = session?.user;
  const rejected = user?.status === "rejected";

  // Once approved + role assigned, leave the waiting room.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (user?.status === "approved" && user.role) {
      router.replace(ROLE_DASHBOARD[user.role] ?? "/dashboard");
    }
  }, [status, user, router]);

  const handleRefresh = async () => {
    setChecking(true);
    await update(); // re-runs the JWT callback server-side → pulls fresh role/status
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center mb-6">
          <Clock className="h-6 w-6 text-primary" />
        </div>

        {rejected ? (
          <>
            <h1 className="font-display text-3xl tracking-tight mb-2">Access not granted</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Your request for{" "}
              <span className="font-medium text-foreground">{user?.email}</span> was not approved.
              Please contact your show administrator if you believe this is a mistake.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl tracking-tight mb-2">Awaiting approval</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Thanks for signing in as{" "}
              <span className="font-medium text-foreground">{user?.email ?? "…"}</span>. An
              administrator needs to approve your account and assign your role before you can
              continue.
            </p>
          </>
        )}

        {!rejected && (
          <a
            href="/profile"
            className="inline-block mb-4 text-sm text-primary hover:underline"
          >
            Complete your profile while you wait →
          </a>
        )}

        <div className="flex items-center justify-center gap-3">
          {!rejected && (
            <button
              onClick={handleRefresh}
              disabled={checking || status === "loading"}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              Check again
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
