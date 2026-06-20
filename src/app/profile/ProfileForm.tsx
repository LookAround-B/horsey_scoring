"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { updateProfileAction } from "./actions";
import type { Profile, ProfileFields } from "@/lib/users";
import { sanitizeImageSrc } from "@/lib/validation";

export function ProfileForm({
  profile,
  required,
  approved,
}: {
  profile: Profile;
  required: Record<ProfileFields, boolean>;
  approved: boolean;
}) {
  const [name, setName] = useState(profile.name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [imageUrl, setImageUrl] = useState(profile.image_url ?? "");
  const [signature, setSignature] = useState(profile.signature ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    fd.set("image_url", imageUrl);
    fd.set("signature", signature);
    startTransition(async () => {
      const res = await updateProfileAction(fd);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  const star = (k: ProfileFields) => (required[k] ? <span className="text-destructive"> *</span> : null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-6 py-10">
        {approved && (
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        )}

        <h1 className="font-display text-3xl tracking-tight mb-1">Your profile</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {approved ? "Keep your details up to date." : "Complete your profile while your account is reviewed."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            {sanitizeImageSrc(imageUrl) ? (
              <img src={sanitizeImageSrc(imageUrl)} alt="" className="h-16 w-16 rounded-full object-cover border border-border" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted grid place-items-center text-lg font-semibold">
                {(name || profile.email || "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-sm text-muted-foreground">{profile.email}</div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Name<span className="text-destructive"> *</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Phone{star("phone")}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Profile image URL{star("image_url")}</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">E-signature{star("signature")}</label>
            <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your full name as signature" className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary font-display italic" />
            <p className="text-[11px] text-muted-foreground mt-1">Used to sign scoring sheets.</p>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {saved ? <><Check className="h-4 w-4" /> Saved</> : pending ? "Saving…" : "Save profile"}
          </button>

          {!approved && (
            <Link href="/auth/pending" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-2">
              Back to approval status
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
