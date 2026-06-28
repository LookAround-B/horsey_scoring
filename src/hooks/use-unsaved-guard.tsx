"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Guards an unsaved sheet builder against losing work on navigation.
 *
 *   const guard = useUnsavedGuard({ dirty, onSave: submit });
 *   <Link href="…" onClick={guard.intercept("…")}>Back</Link>
 *   {guard.dialog}
 *
 * When `dirty` is true:
 *  - in-app Back/Cancel links open a confirm dialog instead of navigating;
 *  - the browser warns on tab close / refresh / external navigation.
 * The dialog offers Save (runs onSave), Discard (navigates anyway), or Keep editing.
 */
export function useUnsavedGuard({ dirty, onSave }: { dirty: boolean; onSave: () => void }) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Warn on tab close / refresh / external navigation while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // onClick factory for a guarded <Link href>. Lets the link through when clean.
  const intercept = useCallback(
    (href: string) => (e: MouseEvent) => {
      if (!dirty) return;
      e.preventDefault();
      setPendingHref(href);
    },
    [dirty],
  );

  const keepEditing = () => setPendingHref(null);

  const discard = () => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  };

  const save = () => {
    setPendingHref(null);
    onSave();
  };

  const dialog = (
    <AlertDialog open={pendingHref !== null} onOpenChange={(o) => { if (!o) setPendingHref(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes on this scoring sheet. Leaving now will discard them.
            Do you want to save your changes first?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <button
            onClick={discard}
            className="mt-2 sm:mt-0 sm:mr-auto text-sm px-4 py-2.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
          >
            Discard changes
          </button>
          <button
            onClick={keepEditing}
            className="text-sm px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Keep editing
          </button>
          <button
            onClick={save}
            className="text-sm px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Save changes
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { intercept, dialog };
}
