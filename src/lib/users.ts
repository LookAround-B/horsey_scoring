import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import type { UserRole, ApprovalStatus } from "@/lib/roles";

export type ProfileFields = "phone" | "image_url" | "signature";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  status: ApprovalStatus;
  phone: string | null;
  image_url: string | null;
  signature: string | null;
};

export async function getProfile(id: string): Promise<Profile | null> {
  const rows = await query<Profile>(
    `select id, name, email, role, status, phone, image_url, signature from users where id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateProfile(
  id: string,
  input: { name: string; phone: string; image_url: string; signature: string }
) {
  await query(
    `update users set name=$2, phone=$3, image_url=$4, signature=$5, updated_at=now() where id=$1`,
    [id, input.name.trim() || null, input.phone.trim() || null, input.image_url.trim() || null, input.signature.trim() || null]
  );
}

export async function getProfileFieldConfig(): Promise<Record<ProfileFields, boolean>> {
  const rows = await query<{ field: ProfileFields; required: boolean }>(
    `select field, required from profile_field_config`
  );
  const map = { phone: false, image_url: false, signature: false } as Record<ProfileFields, boolean>;
  rows.forEach((r) => (map[r.field] = r.required));
  return map;
}

export async function setProfileFieldRequired(field: ProfileFields, required: boolean) {
  await query(
    `insert into profile_field_config (field, required) values ($1,$2)
     on conflict (field) do update set required = excluded.required`,
    [field, required]
  );
}

/** Admin/secretary creates an approved user with a temporary password. */
export async function createUserByAdmin(input: {
  email: string;
  name: string;
  role: UserRole;
  password: string;
  approvedBy: string;
}): Promise<{ error?: string }> {
  const email = input.email.toLowerCase().trim();
  const exists = await query(`select 1 from users where lower(email) = $1`, [email]);
  if (exists.length > 0) return { error: "A user with that email already exists." };
  const hash = await bcrypt.hash(input.password, 10);
  await query(
    `insert into users (name, email, role, status, password_hash, "emailVerified", approved_at, approved_by)
          values ($1,$2,$3,'approved',$4, now(), now(), $5)`,
    [input.name.trim(), email, input.role, hash, input.approvedBy]
  );
  return {};
}

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
