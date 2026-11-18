import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { TimetableExplorer } from "@/components/timetable-explorer";
import { loadSemesterTimetableData } from "@/lib/timetable-data";

export const instant = false;

export default async function RegistryTimetable() {
  await connection();
  const sb = await supabaseServer();
  const { data: semesters } = await sb.from("semesters").select("id,name,status").order("created_at", { ascending: false });
  const sems = (semesters ?? []) as { id: string; name: string; status: string }[];
  const active = sems[0];
  if (!active) {
    return (
      <Shell role="registry" active="/registry/timetable">
        <PageHeader title="Timetable" sub="No semester yet." />
        <EmptyState title="No semester" sub="Create a semester in Settings to get started." />
      </Shell>
    );
  }
  const data = await loadSemesterTimetableData(active.id);
  return (
    <Shell role="registry" active="/registry/timetable">
      <PageHeader
        title="Master Timetable"
        sub={`${active.name} · ${data.versionStatus ? `${data.versionStatus} version` : "no version yet"}. Filter by course, department, year group/level, cohort, or location.`}
      />
      {data.versionId ? (
        <TimetableExplorer
          placements={data.placements}
          periods={data.periods}
          days={data.days}
          options={data.options}
          showRoomView
          title="Search and view timetables (master, by course/department/year group/cohort, and by location)"
        />
      ) : (
        <EmptyState title="No timetable version yet" sub="Generate or create a draft to view the timetable." />
      )}
    </Shell>
  );
}
