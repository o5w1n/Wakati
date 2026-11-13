import { connection } from "next/server";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function LecturerHome() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="lecturer" active="/lecturer">
        <PageHeader title="Home" sub="Sign in to see your day." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,lecturer_id,full_name").eq("id", user.id).single();
  const prof = profile as { university_id: string; lecturer_id: string | null; full_name: string | null } | null;
  const firstName = prof?.full_name?.split(" ")[0] ?? "there";

  if (!prof?.lecturer_id) {
    return (
      <Shell role="lecturer" active="/lecturer">
        <PageHeader title={`Good morning, ${firstName}`} sub="No lecturer record linked yet." />
        <EmptyState title="Not linked" sub="Ask the Registry to link your account to your lecturer record." />
      </Shell>
    );
  }
  const { data: sems } = await sb.from("semesters").select("id,name,status").eq("university_id", prof.university_id).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string; status: string }[])[0];

  let availStatus: "submitted" | "missing" = "missing";
  let sessionCount = 0;
  if (sem) {
    const { count } = await sb.from("lecturer_availability").select("id", { count: "exact", head: true }).eq("semester_id", sem.id).eq("lecturer_id", prof.lecturer_id);
    availStatus = (count ?? 0) > 0 ? "submitted" : "missing";
    const { count: sc } = await sb.from("sessions").select("id", { count: "exact", head: true }).eq("semester_id", sem.id).eq("lecturer_id", prof.lecturer_id);
    sessionCount = sc ?? 0;
  }

  return (
    <Shell role="lecturer" active="/lecturer">
      <PageHeader title={`Good morning, ${firstName}`} sub={sem ? `${sem.name} · ${sessionCount} sessions` : "No semester yet."} />
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Timetable</div>
          <div className="px-4 py-3 text-[13px]">
            {sessionCount === 0 ? "No sessions assigned to you yet." : `${sessionCount} sessions assigned — see your full grid.`}
            <Link href="/lecturer/timetable" className="mt-2 block text-indigo-deep hover:underline">Full timetable →</Link>
          </div>
        </section>
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Availability</div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] text-body">{sem?.name ?? "No semester"}</span>
            {availStatus === "submitted" ? <StatusBadge tone="ok">Submitted</StatusBadge> : <StatusBadge tone="warn">Not submitted</StatusBadge>}
          </div>
          <div className="px-4 pb-3">
            <Link href="/lecturer/availability" className="text-[13px] text-indigo-deep hover:underline">Fill in your grid →</Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
