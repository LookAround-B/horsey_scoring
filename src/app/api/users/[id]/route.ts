import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";
import type { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();
  const { name, email, role, phone } = body;

  try {
    await query(
      `update users set name=$2, email=$3, role=$4, phone=$5, updated_at=now() where id=$1`,
      [id, name?.trim() || null, email?.trim() || null, role || null, phone?.trim() || null]
    );

    const result = await query(
      `select id, name, email, role, status, image_url, phone, created_at from users where id = $1`,
      [id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
