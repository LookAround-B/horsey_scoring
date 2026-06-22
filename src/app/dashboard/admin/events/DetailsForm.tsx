"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateEventMetaAction } from "./actions";
import { GuidelinesField } from "./GuidelinesField";
import { DatePicker, TimePicker, FieldLabel, parseISODate, parseTimeParts } from "./DateTimePickers";
import type { GuidelineTemplate } from "@/lib/events";

type EventMeta = {
  name: string;
  location: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  guidelines: string | null;
};

export function DetailsForm({
  eventId,
  ev,
  templates,
}: {
  eventId: string;
  ev: EventMeta;
  templates: GuidelineTemplate[];
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(ev.status);
  const [startDate, setStartDate] = useState(parseISODate(ev.start_date));
  const [endDate, setEndDate] = useState(parseISODate(ev.end_date));
  const [startTime, setStartTime] = useState(parseTimeParts(ev.start_time));
  const [endTime, setEndTime] = useState(parseTimeParts(ev.end_time));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateEventMetaAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Details saved.");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input type="hidden" name="eventId" value={eventId} />

      {/* Name */}
      <div className="sm:col-span-2">
        <FieldLabel>Name</FieldLabel>
        <input
          name="name"
          defaultValue={ev.name}
          required
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Venue */}
      <div>
        <FieldLabel>Venue</FieldLabel>
        <input
          name="location"
          defaultValue={ev.location ?? ""}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Status */}
      <div>
        <FieldLabel>Status</FieldLabel>
        <input type="hidden" name="status" value={status} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full bg-background border-border text-sm h-9 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DatePicker label="Start date" name="startDate" value={startDate} onChange={setStartDate} />
      <DatePicker label="End date"   name="endDate"   value={endDate}   onChange={setEndDate}   />
      <TimePicker label="Start time" name="startTime" value={startTime} onChange={setStartTime} />
      <TimePicker label="End time"   name="endTime"   value={endTime}   onChange={setEndTime}   />

      {/* Guidelines */}
      <div className="sm:col-span-2">
        <GuidelinesField initial={ev.guidelines} templates={templates} />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
