// Shared, dependency-free role definitions.
// Kept separate from dummy-data.ts so server code (middleware, route handlers)
// can import these constants without pulling in the large demo dataset.

export type UserRole =
  | "super_admin"
  | "dressage_judge"
  | "showjumping_judge"
  | "dressage_writer"
  | "showjumping_writer"
  | "club"
  | "rider"
  | "show_secretary";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  dressage_judge: "Dressage Judge",
  showjumping_judge: "Showjumping Judge",
  dressage_writer: "Dressage Writer",
  showjumping_writer: "Showjumping Writer",
  club: "Club",
  rider: "Rider",
  show_secretary: "Show Secretary",
};

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  super_admin: "/dashboard/admin",
  dressage_judge: "/dashboard/judge/dressage",
  showjumping_judge: "/dashboard/judge/showjumping",
  dressage_writer: "/dashboard/writer/dressage",
  showjumping_writer: "/dashboard/writer/showjumping",
  club: "/dashboard/club",
  rider: "/dashboard/rider",
  show_secretary: "/dashboard/secretary",
};

// Roles the super admin can assign during approval (everything except super_admin).
export const ASSIGNABLE_ROLES: UserRole[] = [
  "dressage_judge",
  "showjumping_judge",
  "dressage_writer",
  "showjumping_writer",
  "club",
  "rider",
  "show_secretary",
];
