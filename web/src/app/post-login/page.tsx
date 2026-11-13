import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/supabase-server";

export const instant = false;

const HOME: Record<string, string> = {
  super_admin: "/admin",
  timetable_admin: "/registry",
  hod: "/hod",
  lecturer: "/lecturer",
  student: "/student",
};

export default async function PostLogin() {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (!profile.role || !profile.university_id) redirect("/signup/pending");
  redirect(HOME[profile.role] ?? "/signup/pending");
}
