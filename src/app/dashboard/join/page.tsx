"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { joinByCodeAction } from "./actions";

export default function JoinEventPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("code", code);
    startTransition(async () => {
      const res = await joinByCodeAction(fd);
      if (res?.error) setError(res.error);
      // success → server action redirects to the event
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-card border border-border rounded-xl p-8 mt-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-4">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl tracking-tight mb-2">Join an event</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the access code your show secretary shared with you.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full text-center font-mono text-lg tracking-[0.3em] uppercase bg-background border border-border rounded-lg px-3 py-3 outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? "Joining…" : "Join event"}
          </button>
        </form>
      </div>
    </div>
  );
}
