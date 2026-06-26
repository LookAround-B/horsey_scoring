import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileFieldConfig } from "@/lib/users";
import { SlidersHorizontal } from "lucide-react";
import { ProfileFieldsForm } from "./ProfileFieldsForm";

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

      <ProfileFieldsForm fields={FIELDS} cfg={cfg} />
    </div>
  );
}
