import type { DefaultSession } from "next-auth";
import type { UserRole, ApprovalStatus } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | null;
      status: ApprovalStatus;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole | null;
    status?: ApprovalStatus;
    refreshedAt?: number;
  }
}
