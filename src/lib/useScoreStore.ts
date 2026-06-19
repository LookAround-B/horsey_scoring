"use client";

import { useCallback } from "react";

type Meta = { result?: number | null; signature?: string | null; status?: "draft" | "submitted" | "verified" };

/**
 * Persists a sheet's state. In event context (eventId set) it reads/writes the
 * shared DB record via /api/scores so judges, writers, secretary and admin all
 * see the same data. Standalone (no event) it falls back to localStorage.
 */
export function useScoreStore(opts: {
  slug: string;
  eventId?: string | null;
  riderId?: string | null;
  localKey: string;
}) {
  const { slug, eventId, riderId, localKey } = opts;
  const db = !!eventId;

  const load = useCallback(async (): Promise<Record<string, unknown> | null> => {
    if (db) {
      try {
        const qs = new URLSearchParams({ event: eventId!, slug });
        if (riderId) qs.set("rider", riderId);
        const r = await fetch(`/api/scores?${qs.toString()}`);
        if (!r.ok) return null;
        const rec = await r.json();
        return (rec?.data as Record<string, unknown>) ?? null;
      } catch {
        return null;
      }
    }
    try {
      const raw = localStorage.getItem(localKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [db, eventId, riderId, slug, localKey]);

  const save = useCallback(
    async (data: Record<string, unknown>, meta?: Meta) => {
      if (db) {
        try {
          await fetch(`/api/scores`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ eventId, slug, riderId: riderId || null, data, ...meta }),
          });
        } catch {
          /* ignore */
        }
      } else {
        try {
          localStorage.setItem(localKey, JSON.stringify(data));
        } catch {
          /* ignore */
        }
      }
    },
    [db, eventId, riderId, slug, localKey]
  );

  return { db, load, save };
}
