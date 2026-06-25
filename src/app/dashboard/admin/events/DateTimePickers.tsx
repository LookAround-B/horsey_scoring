"use client";

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function parseISODate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = parse(iso, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

export function parseTimeParts(t: string | null | undefined): { h: string; m: string } {
  if (!t) return { h: "", m: "" };
  const [h = "", m = ""] = t.split(":");
  return { h: h.padStart(2, "0"), m: m.padStart(2, "0") };
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
      {children}
    </div>
  );
}

export function DatePicker({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input type="hidden" name={name} value={value ? format(value, "yyyy-MM-dd") : ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors text-left",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? format(value, "dd MMM yyyy") : "Pick a date"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false); }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function TimePicker({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: { h: string; m: string };
  onChange: (v: { h: string; m: string }) => void;
}) {
  const combined = value.h && value.m ? `${value.h}:${value.m}` : "";
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input type="hidden" name={name} value={combined} />
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select value={value.h} onValueChange={(h) => onChange({ ...value, h })}>
          <SelectTrigger
            aria-label={`${label} hour`}
            className="flex-1 h-7 border-0 bg-transparent px-1.5 text-sm shadow-none focus:ring-0 focus:ring-offset-0"
          >
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-52">
            {HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground font-medium">:</span>
        <Select value={value.m} onValueChange={(m) => onChange({ ...value, m })}>
          <SelectTrigger
            aria-label={`${label} minute`}
            className="flex-1 h-7 border-0 bg-transparent px-1.5 text-sm shadow-none focus:ring-0 focus:ring-offset-0"
          >
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-52">
            {MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
