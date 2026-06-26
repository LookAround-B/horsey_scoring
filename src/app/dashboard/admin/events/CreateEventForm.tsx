"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createFullEventAction } from "./actions";
import { GuidelinesField } from "./GuidelinesField";
import { SheetsField } from "./SheetsField";
import { DatePicker, TimePicker, FieldLabel, parseTimeParts } from "./DateTimePickers";
import type { TestCard } from "@/lib/dummy-data";
import type { GuidelineTemplate } from "@/lib/events";
import { Input } from "@/components/ui/input";

type Secretary = { id: string; name: string | null; email: string };

export function CreateEventForm({
  isAdmin,
  secretaries,
  allSheets,
  templates,
}: {
  isAdmin: boolean;
  secretaries: Secretary[];
  allSheets: TestCard[];
  templates: GuidelineTemplate[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [secretaryId, setSecretaryId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState(parseTimeParts(null));
  const [endTime, setEndTime] = useState(parseTimeParts(null));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createFullEventAction(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Event created successfully!");
        router.push(`/dashboard/admin/events/${res.id}`);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {/* Name */}
      <div className="sm:col-span-2">
        <FieldLabel>Event name</FieldLabel>
        <Input
          name="name"
          required
          placeholder="e.g. KSEC Spring Classic 2026"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Venue */}
      <div>
        <FieldLabel>Venue</FieldLabel>
        <Input
          name="location"
          placeholder="Arena / city"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Secretary (admin only) */}
      {isAdmin && (
        <div>
          <FieldLabel>Secretary</FieldLabel>
          <input type="hidden" name="secretaryId" value={secretaryId} />
          <Select value={secretaryId} onValueChange={setSecretaryId}>
            <SelectTrigger className="w-full bg-background border-border text-sm h-9 rounded-lg">
              <SelectValue placeholder="— Me (admin) —" />
            </SelectTrigger>
            <SelectContent>
              {secretaries.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name ?? s.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DatePicker label="Start date" name="startDate" value={startDate} onChange={setStartDate} />
      <DatePicker label="End date"   name="endDate"   value={endDate}   onChange={setEndDate}   />
      <TimePicker label="Start time" name="startTime" value={startTime} onChange={setStartTime} />
      <TimePicker label="End time"   name="endTime"   value={endTime}   onChange={setEndTime}   />

      {/* Guidelines */}
      <div className="sm:col-span-2">
        <GuidelinesField templates={templates} />
      </div>

      <SheetsField sheets={allSheets} />

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {pending ? "Creating…" : "Create event"}
        </button>
        <p className="text-[11px] text-muted-foreground mt-2">
          After creating, you&apos;ll set up riders, judges, writers, the access code and visibility.
        </p>
      </div>
    </form>
  );
}
