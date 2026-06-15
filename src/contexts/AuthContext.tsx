"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { type User, type UserRole, ROLE_DASHBOARD } from "@/lib/dummy-data";

export type AuthStatus = "loading" | "unauthenticated" | "pending" | "approved";

type LoginResult = { error?: string; status?: AuthStatus };

type AuthContextType = {
  user: User | null; // populated only when approved + role assigned
  status: AuthStatus;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: "loading",
  isLoading: true,
  login: async () => ({}),
  loginWithGoogle: async () => ({}),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();

  let status: AuthStatus = "loading";
  let user: User | null = null;

  if (sessionStatus === "loading") {
    status = "loading";
  } else if (sessionStatus === "unauthenticated" || !session?.user) {
    status = "unauthenticated";
  } else {
    const su = session.user;
    if (su.status === "approved" && su.role) {
      status = "approved";
      user = {
        id: su.id,
        name: su.name ?? su.email ?? "",
        email: su.email ?? "",
        role: su.role,
      };
    } else {
      status = "pending";
    }
  }

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) return { error: "Invalid email or password" };
    // Session refreshes via SessionProvider; caller relies on `status` afterwards.
    return {};
  };

  const loginWithGoogle = async (): Promise<{ error?: string }> => {
    // Full-page redirect through Google → /api/auth/callback/google.
    await signIn("google", { callbackUrl: "/" });
    return {};
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <AuthContext.Provider
      value={{ user, status, isLoading: status === "loading", login, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD[role] ?? "/dashboard";
}
