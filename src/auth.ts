import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import { pool, query } from "@/lib/db";
import type { UserRole, ApprovalStatus } from "@/lib/roles";

type CredRow = {
  id: string;
  name: string | null;
  email: string | null;
  password_hash: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    // Anyone can sign in with Google; new accounts land as `pending` (DB default).
    Google({ allowDangerousEmailAccountLinking: true }),

    // Email/password — used for the seeded super admin.
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const rows = await query<CredRow>(
          `select id, name, email, password_hash from users where lower(email) = $1 limit 1`,
          [email]
        );
        const u = rows[0];
        if (!u?.password_hash) return null;

        const ok = await bcrypt.compare(password, u.password_hash);
        if (!ok) return null;

        return { id: u.id, name: u.name ?? u.email, email: u.email };
      },
    }),
  ],
  callbacks: {
    // Refresh role/status from DB at most once per 30s so approvals take effect quickly
    // without hammering the DB on every session check.
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      const id = (token.id ?? token.sub) as string | undefined;
      const freshLogin = !!user?.id;
      const stale = !token.refreshedAt || Date.now() - token.refreshedAt > 30_000;
      if (id && (freshLogin || stale)) {
        try {
          const rows = await query<{ role: UserRole | null; status: ApprovalStatus }>(
            `select role, status from users where id = $1`,
            [id]
          );
          token.role = rows[0]?.role ?? null;
          token.status = rows[0]?.status ?? "pending";
          token.refreshedAt = Date.now();
        } catch (err) {
          console.error("[auth] jwt DB refresh failed, keeping cached values:", (err as Error).message);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = (token.role ?? null) as UserRole | null;
        session.user.status = (token.status ?? "pending") as ApprovalStatus;
      }
      return session;
    },
  },
});
