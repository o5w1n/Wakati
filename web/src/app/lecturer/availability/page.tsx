import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { AvailabilityForm } from "./form";

export const instant = false;

export default async function LecturerAvailability() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="lecturer" active="/lecturer/availability">
        <PageHeader title="Availability" sub="Sign in first." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,lecturer_id").eq("id", user.id).single();
  const prof = profile as { university_id: string; lecturer_id: string | null } | null;
  if (!prof?.lecturer_id) {
    return (
      <Shell role="lecturer" active="/lecturer/availability">
        <PageHeader title="Availability" sub="No lecturer record linked." />
        <EmptyState title="Not linked" sub="Ask the Registry to link your account to your lecturer record." />
      </Shell>
    );
  }
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", prof.university_id).order("created_at", { ascending: false });
  const sems2 = (sems ?? []) as { id: string; name: string }[];
  const active = sems2.find((s) => true) ?? sems2[0];
  if (!active) {
    return (
      <Shell role="lecturer" active="/lecturer/availability">
        <PageHeader title="Availability" sub="No semester yet." />
      </Shell>
    );
  }
  const { data: periods } = await sb.from("periods").select("day_of_week,period_index").eq("semester_id", active.id).order("day_of_week").order("period_index");
  const plist = (periods ?? []) as { day_of_week: number; period_index: number }[];
  const days = [...new Set(plist.map((p) => p.day_of_week))].sort();
  const maxP = Math.max(0, ...plist.map((p) => p.period_index));
  const { data: existing } = await sb
    .from("lecturer_availability")
    .select("day_of_week,period_index,status")
    .eq("semester_id", active.id)
    .eq("lecturer_id", prof.lecturer_id);
  const emap: Record<string, string> = {};
  for (const e of ((existing ?? []) as { day_of_week: number; period_index: number; status: string }[])) {
    emap[`${e.day_of_week}:${e.period_index}`] = e.status;
  }

  return (
    <Shell role="lecturer" active="/lecturer/availability">
      <AvailabilityForm semesterId={active.id} semesterName={active.name} days={days} maxPeriod={maxP} initial={emap} />
    </Shell>
  );
}
