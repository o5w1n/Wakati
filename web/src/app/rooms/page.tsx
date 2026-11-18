import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { TimetableExplorer } from "@/components/timetable-explorer";
import { loadSemesterTimetableData } from "@/lib/timetable-data";

export const instant = false;

export default async function RoomFinder() {
  await connection();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <EmptyState title="Sign in required" sub="Sign in to view timetables by location." />
      </div>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,role").eq("id", user.id).single();
  const uni = (profile as { university_id: string | null } | null)?.university_id;
  const role = (profile as { role: string | null } | null)?.role || "student";
  const shellRole = role === "timetable_admin" ? "registry" : role === "super_admin" ? "superadmin" : (role as any);

  let semId: string | null = null;
  if (uni) {
    const { data: sems } = await sb.from("semesters").select("id,status,created_at").eq("university_id", uni).order("created_at", { ascending: false });
    const list = (sems ?? []) as { id: string; status: string }[];
    semId = (list.find((s) => s.status === "published") || list[0])?.id ?? null;
  }
  if (!semId) {
    return (
      <Shell role={shellRole === "registry" || shellRole === "hod" || shellRole === "lecturer" || shellRole === "student" || shellRole === "superadmin" ? shellRole : "student"} active="/rooms">
        <PageHeader title="Timetable by Location" sub="No semester available." />
        <EmptyState title="No semester" sub="No timetable data available yet." />
      </Shell>
    );
  }
  const data = await loadSemesterTimetableData(semId);
  return (
    <Shell role={shellRole === "registry" || shellRole === "hod" || shellRole === "lecturer" || shellRole === "student" || shellRole === "superadmin" ? shellRole : "student"} active="/rooms">
      <PageHeader title="Timetable by Location" sub="Search what class happens at what location at what time, or browse each room’s schedule." />
      {data.versionId ? (
        <TimetableExplorer
          placements={data.placements}
          periods={data.periods}
          days={data.days}
          options={data.options}
          showRoomView
          title="Room/location timetable and search"
        />
      ) : (
        <EmptyState title="No timetable yet" sub="No timetable version is available." />
      )}
    </Shell>
  );
}
