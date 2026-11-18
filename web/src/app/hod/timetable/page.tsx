import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { TimetableExplorer } from "@/components/timetable-explorer";
import { loadSemesterTimetableData } from "@/lib/timetable-data";

export const instant = false;

export default async function HodTimetable() {
  await connection();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="hod" active="/hod/timetable">
        <PageHeader title="Department Timetable" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  if (!sem) {
    return (
      <Shell role="hod" active="/hod/timetable">
        <PageHeader title="Department Timetable" sub="No semester yet." />
        <EmptyState title="No semester" sub="The Registry creates the semester first." />
      </Shell>
    );
  }
  const data = await loadSemesterTimetableData(sem.id);
  return (
    <Shell role="hod" active="/hod/timetable">
      <PageHeader
        title="Timetables"
        sub={`${sem.name} · ${data.versionStatus ?? "no version"}. View master timetable, by course/department/year group/cohort, search by location & time.`}
      />
      {data.versionId ? (
        <TimetableExplorer
          placements={data.placements}
          periods={data.periods}
          days={data.days}
          options={data.options}
          showRoomView
          title="Department and master timetable views"
        />
      ) : (
        <EmptyState title="No timetable version yet" sub="Check back after the Registry generates a timetable." />
      )}
    </Shell>
  );
}
