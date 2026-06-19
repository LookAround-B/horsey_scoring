import { query } from "@/lib/db";
import type { UserRole, ApprovalStatus } from "@/lib/roles";

export type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  status: ApprovalStatus;
  image_url: string | null;
  phone: string | null;
  created_at: string;
};

export async function listUsers(): Promise<AppUser[]> {
  return query<AppUser>(
    `select id, name, email, role, status, image_url, phone, created_at
       from users
      order by (status = 'pending') desc, created_at desc`
  );
}

export async function setUserApproval(id: string, role: UserRole, approvedBy: string) {
  await query(
    `update users
        set role = $2, status = 'approved', approved_at = now(), approved_by = $3
      where id = $1`,
    [id, role, approvedBy]
  );
}

export async function rejectUser(id: string) {
  await query(`update users set status = 'rejected' where id = $1`, [id]);
}
