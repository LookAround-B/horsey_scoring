import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json(users);
}
