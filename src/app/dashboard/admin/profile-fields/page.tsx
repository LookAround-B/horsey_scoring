import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileFieldConfig } from "@/lib/users";
import { setProfileFieldsAction } from "./actions";
import { SlidersHorizontal } from "lucide-react";

export const dynamic = "force-dynamic";

const FIELDS: { key: "phone" | "image_url" | "signature"; label: string; hint: string }[] = [
  { key: "phone", label: "Phone number", hint: "" },
  { key: "image_url", label: "Profile image", hint: "" },
  { key: "signature", label: "E-signature", hint: "Used to sign scoring sheets." },
];

export default async function ProfileFieldsPage() {
  const s = await auth();
  if (s?.user?.role !== "super_admin" || s.user.status !== "approved") redirect("/dashboard");

  const cfg = await getProfileFieldConfig();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">Mandatory profile fields</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Choose which profile fields users must fill in. Name is always required.
      </p>

      <form action={setProfileFieldsAction} className="bg-card border border-border rounded-xl divide-y divide-border">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer">
            <div>
              <div className="text-sm font-medium">{f.label}</div>
              {f.hint && <div className="text-xs text-muted-foreground">{f.hint}</div>}
            </div>
            <input type="checkbox" name={f.key} defaultChecked={cfg[f.key]} className="h-4 w-4 rounded border-border accent-primary" />
          </label>
        ))}
        <div className="px-4 py-3">
          <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
