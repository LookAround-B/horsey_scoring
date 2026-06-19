import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsers } from "@/lib/users";
import { UsersDirectory } from "./UsersDirectory";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  const users = await listUsers();
  return <UsersDirectory users={users} />;
}
