"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { setProfileFieldsAction } from "./actions";

type Field = { key: "phone" | "image_url" | "signature"; label: string; hint: string };

export function ProfileFieldsForm({
  fields,
  cfg,
}: {
  fields: Field[];
  cfg: Record<string, boolean>;
}) {
  return (
    <form action={setProfileFieldsAction} className="bg-card border border-border rounded-xl divide-y divide-border">
      {fields.map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer">
          <div>
            <div className="text-sm font-medium">{f.label}</div>
            {f.hint && <div className="text-xs text-muted-foreground">{f.hint}</div>}
          </div>
          <Checkbox name={f.key} defaultChecked={cfg[f.key]} />
        </label>
      ))}
      <div className="px-4 py-3">
        <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
          Save
        </button>
      </div>
    </form>
  );
}
