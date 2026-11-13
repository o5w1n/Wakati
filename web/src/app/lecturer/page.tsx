import { connection } from "next/server";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { EmptyState, btnSecondaryCls } from "@/components/ui";
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
        <h1 className="text-2xl font-bold text-heading">Hello!</h1>
        <p className="mt-1 text-[13px] text-body">Sign in to see your day.</p>
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,lecturer_id,full_name").eq("id", user.id).single();
  const prof = profile as { university_id: string; lecturer_id: string | null; full_name: string | null } | null;
  const firstName = prof?.full_name?.split(" ")[0] ?? "there";

  if (!prof?.lecturer_id) {
    return (
      <Shell role="lecturer" active="/lecturer">
        <h1 className="text-2xl font-bold text-heading">Hello, {firstName}!</h1>
        <p className="mt-1 text-[13px] text-body">No lecturer record linked yet.</p>
        <div className="mt-4"><EmptyState title="Not linked" sub="Ask the Registry to link your account to your lecturer record." /></div>
      </Shell>
    );
  }

  // next class from the latest published (or draft) version
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", prof.university_id).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  let nextClass: { code: string; title: string; day: string; start: string; room: string } | null = null;
  let myCount = 0;
  if (sem) {
    const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(1);
    const ver = ((vers ?? []) as { id: string }[])[0];
    if (ver) {
      const { data: sess } = await sb.from("sessions").select("id,session_key").eq("semester_id", sem.id).eq("lecturer_id", prof.lecturer_id);
      const mySess = (sess ?? []) as { id: string; session_key: string }[];
      myCount = mySess.length;
      if (mySess.length > 0) {
        const ids = mySess.map((s) => s.id);
        const { data: pl } = await sb
          .from("placements")
          .select("day_of_week,start_period,session_id,rooms(code),periods:periods!inner(start_time)")
          .eq("version_id", ver.id)
          .in("session_id", ids)
          .order("day_of_week")
          .order("start_period")
          .limit(1);
        const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
        const row = ((pl ?? []) as unknown as {
          day_of_week: number; start_period: number; session_id: string;
          rooms: { code: string } | { code: string }[] | null;
          periods: { start_time: string } | { start_time: string }[] | null;
        }[])[0];
        if (row) {
          const key = mySess.find((s) => s.id === row.session_id)?.session_key ?? "";
          const room = first(row.rooms);
          const per = first(row.periods);
          const days = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          nextClass = {
            code: key, title: "", day: days[row.day_of_week] ?? "",
            start: (per?.start_time ?? "").slice(0, 5), room: room?.code ?? "?",
          };
        }
      }
    }
  }

  return (
    <Shell role="lecturer" active="/lecturer">
      <h1 className="text-[26px] font-bold tracking-tight text-heading">Hello, {firstName}!</h1>
      <p className="mt-1 text-[13px] text-body">Here’s your next class.</p>

      <section className="mt-5 rounded-xl border border-cardline bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lavender/60 text-primary" aria-hidden>
              <CalendarDays size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-body">Next Class</p>
              {nextClass ? (
                <>
                  <p className="truncate text-[17px] font-bold text-heading">{nextClass.code}</p>
                  <p className="mt-0.5 text-[13px] text-body">{nextClass.day}, {nextClass.start} • {nextClass.room}</p>
                </>
              ) : (
                <p className="text-[15px] font-bold text-heading">
                  {myCount === 0 ? "No sessions assigned yet" : "Nothing scheduled"}
                </p>
              )}
            </div>
          </div>
          <Link href="/lecturer/timetable" aria-label="Open my timetable" className="shrink-0 text-body transition-colors hover:text-heading">
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <Link href="/lecturer/availability" className={`${btnSecondaryCls} !border-cardline !text-heading`}>
          Set availability
        </Link>
        <Link href="/lecturer/timetable" className={`${btnSecondaryCls} !border-cardline !text-heading`}>
          My timetable
        </Link>
      </section>
    </Shell>
  );
}
