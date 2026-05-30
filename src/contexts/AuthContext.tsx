"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type User, type UserRole, DUMMY_USERS, ROLE_DASHBOARD } from "@/lib/dummy-data";

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({}),
  logout: () => {},
  isLoading: true,
});

const STORAGE_KEY = "horsey-user";
const DEMO_PASSWORD = "Horsey@2025";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    if (password !== DEMO_PASSWORD) return { error: "Invalid password" };
    const found = DUMMY_USERS.find((u) => u.email === email);
    if (!found) return { error: "No account found with that email" };
    setUser(found);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    document.cookie = "horsey-auth=1; path=/; max-age=86400";
    return {};
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = "horsey-auth=; path=/; max-age=0";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD[role] ?? "/dashboard";
}
