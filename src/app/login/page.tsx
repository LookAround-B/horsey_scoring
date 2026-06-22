"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login, loginWithGoogle, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const from = new URLSearchParams(window.location.search).get("from");
      router.replace(from ?? "/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.status === "pending") {
      router.replace("/auth/pending");
    }
    // approved users are redirected by the effect above once `user` resolves
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await loginWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
    // on success the browser is redirected to Google, then /auth/callback
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-highlight/20 blur-3xl" />
        <div className="absolute -top-12 -right-12 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo.png" alt="Horsey" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl">Horsey</span>
          </div>
          <h1 className="font-display text-5xl leading-[1.1] tracking-tight mb-6">
            The complete<br />
            <span className="italic text-highlight">equestrian</span><br />
            scoring platform
          </h1>
          <p className="text-primary-foreground/70 max-w-sm leading-relaxed">
            Manage events, score dressage tests, and track rider results — all in one place.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/50">
          Horsey · FEI Dressage Interactive Scoring Sheets
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Horsey" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl">Horsey</span>
          </div>

          <h2 className="font-display text-3xl tracking-tight mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-8">Access your role-based dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-lg py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="text-[11px] text-muted-foreground mt-3 text-center leading-relaxed">
            First time here? Sign in with Google to request access — an admin will approve your account.
          </p>
        </div>
      </div>
    </div>
  );
}
