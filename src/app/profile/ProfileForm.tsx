"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Type, Upload, Link2 } from "lucide-react";
import { updateProfileAction } from "./actions";
import type { Profile, ProfileFields } from "@/lib/users";
import { sanitizeImageSrc } from "@/lib/validation";

const FONT_SIZES = ["sm", "md", "lg", "xl"] as const;
type FontSize = (typeof FONT_SIZES)[number];
const FONT_LABELS: Record<FontSize, string> = { sm: "A-", md: "A", lg: "A+", xl: "A++" };

/** Read a picked image file, downscale to <= 512px, and return a compact JPEG data URL. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image."));
      img.onload = () => {
        const max = 512;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Image processing not supported."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    try {
      setError("");
      const dataUrl = await fileToDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that image.");
    }
  };

  // Load the saved text size and apply it (also applied app-wide by the dashboard layout).
  useEffect(() => {
    try {
      const stored = localStorage.getItem("font-size") as FontSize;
      if (stored && FONT_SIZES.includes(stored)) {
        setFontSize(stored);
        document.documentElement.dataset.fontSize = stored;
      }
    } catch {}
  }, []);

  const changeFontSize = (size: FontSize) => {
    setFontSize(size);
    try {
      localStorage.setItem("font-size", size);
      document.documentElement.dataset.fontSize = size;
    } catch {}
  };

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
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Profile image{star("image_url")}</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Upload className="h-3.5 w-3.5" /> Choose from device
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            {imageUrl.startsWith("data:") ? (
              <p className="text-[11px] text-muted-foreground mt-2">Uploaded from device.</p>
            ) : (
              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <Link2 className="h-3 w-3" /> or paste an image URL
                </div>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            )}
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

        {/* Text size — applies across all portals, saved on this device */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-1">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Text size</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Adjust how large text appears across the app. Saved on this device.
          </p>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => changeFontSize(size)}
                title={`Text size: ${size}`}
                className={`min-w-10 px-3 py-1.5 rounded-md text-center leading-none transition-colors ${
                  fontSize === size
                    ? "bg-card text-foreground shadow-soft font-medium"
                    : "text-muted-foreground hover:text-foreground"
                } ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : size === "lg" ? "text-base" : "text-lg"}`}
              >
                {FONT_LABELS[size]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
