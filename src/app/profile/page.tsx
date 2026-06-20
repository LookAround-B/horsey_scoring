import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile, getProfileFieldConfig } from "@/lib/users";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const s = await auth();
  if (!s?.user) redirect("/login");

  const [profile, required] = await Promise.all([getProfile(s.user.id), getProfileFieldConfig()]);
  if (!profile) redirect("/login");

  return <ProfileForm profile={profile} required={required} approved={s.user.status === "approved"} />;
}
