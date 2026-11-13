import Link from "next/link";
import { connection } from "next/server";
import { CheckCircle2, AlertTriangle, Play } from "lucide-react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnPrimaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { queueSolveJob } from "@/app/actions/solve";

export const instant = false;

interface Check {
  ok: boolean;
  text: string;
}

async function precheck(semesterId: string, uni: string): Promise<Check[]> {
  const sb = await supabaseServer();
  const checks: Check[] = [];
  const [{ data: rooms }, { data: sessions }, { data: periods }] = await Promise.all([
    sb.from("rooms").select("code,capacity,type").eq("university_id", uni),
    sb.from("sessions").select("session_key,expected_students,required_room_type,component").eq("semester_id", semesterId),
    sb.from("periods").select("id").eq("semester_id", semesterId),
  ]);
  const rms = (rooms ?? []) as { code: string; capacity: number; type: string }[];
  const sess = (sessions ?? []) as { session_key: string; expected_students: number; required_room_type: string; component: string }[];
  const maxCap = Math.max(0, ...rms.filter((r) => r.type === "lecture").map((r) => r.capacity));
  const labs = rms.filter((r) => r.type === "computer_lab").length;

  const tooBig = sess.filter((s) => s.expected_students > maxCap);
  checks.push(
    tooBig.length === 0
      ? { ok: true, text: `Room capacity: largest lecture room seats ${maxCap}, largest class needs ${Math.max(0, ...sess.map((s) => s.expected_students))}.` }
      : { ok: false, text: `${tooBig.map((s) => s.session_key).join(", ")}: needs more seats than the largest lecture room (${maxCap}). Fix capacity or split the cohort.` }
  );
  const practicals = sess.filter((s) => s.component === "practical").length;
  checks.push(
    labs > 0 || practicals === 0
      ? { ok: true, text: `Labs: ${practicals} practical sessions, ${labs} computer labs available.` }
      : { ok: false, text: `${practicals} practical sessions but no computer labs exist.` }
  );
  checks.push(
    (periods ?? []).length > 0
      ? { ok: true, text: `Time grid: ${(periods ?? []).length} periods defined for this semester.` }
      : { ok: false, text: "No time grid — import periods.csv or reseed from Settings." }
  );
  return checks;
}

export default async function Generate() {
  await connection();
  const sb = await supabaseServer();
  const { data: semesters } = await sb.from("semesters").select("id,name,status").order("created_at", { ascending: false });
  const sems = (semesters ?? []) as { id: string; name: string; status: string }[];
  const active = sems[0];
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data: me } = user ? await sb.from("profiles").select("university_id").eq("id", user.id).single() : { data: null };
  const uni = (me as { university_id: string } | null)?.university_id;

  const checks = active && uni ? await precheck(active.id, uni) : [];
  const { data: jobs } = active
    ? await sb.from("solve_jobs").select("id,status,progress,quality_score,conflict_report,created_at").eq("semester_id", active.id).order("created_at", { ascending: false }).limit(1)
    : { data: null };
  const latest = ((jobs ?? []) as { id: string; status: string; progress: number; quality_score: number | null; conflict_report: { session_key: string; reason: string }[] | null; created_at: string }[])[0];
  const fatal = checks.filter((c) => !c.ok);

  return (
    <Shell role="registry" active="/registry/generate">
      <PageHeader
        title="Generate"
        sub={active ? `${active.name} · ${active.status}` : "No semester yet — create one in Settings."}
        actions={
          active && fatal.length === 0 ? (
            <form action={async () => { await queueSolveJob(active.id); }}>
              <button className={btnPrimaryCls}><Play size={15} /> Run solver</button>
            </form>
          ) : undefined
        }
      />

      {!active ? (
        <p className="text-[13px] text-muted">Create a semester in Settings, import your CSVs, then come back here.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="border border-line bg-paper">
            <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">
              Pre-check — impossible inputs before generating
            </div>
            <ul className="px-4 py-2">
              {checks.map((c) => (
                <li key={c.text} className="flex items-start gap-2 py-2 text-[13px]">
                  {c.ok
                    ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-ok-text" />
                    : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-bad-text" />}
                  <span className={c.ok ? "text-body" : "text-ink"}>{c.text}</span>
                </li>
              ))}
            </ul>
            {fatal.length > 0 && (
              <p className="border-t border-line px-4 py-2 text-[13px] text-muted">Fix the items above before running the solver.</p>
            )}
          </section>

          <section className="border border-line bg-paper">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-sm font-medium text-ink">
                {latest ? `Latest run — ${latest.status}` : "No runs yet"}
              </span>
              {latest?.quality_score != null && <StatusBadge tone="ok">score {latest.quality_score}</StatusBadge>}
            </div>
            <div className="px-4 py-3">
              {latest ? (
                <>
                  <div className="h-1.5 w-full bg-canvas-2">
                    <div className="h-1.5 bg-indigo-deep" style={{ width: `${latest.progress}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-muted">
                    {latest.status === "queued" && "Queued — the solver worker picks it up."}
                    {latest.status === "running" && `Running — ${latest.progress}%`}
                    {latest.status === "done" && "Done."}
                    {latest.status === "failed" && "Failed — check the worker logs."}
                  </div>
                  {latest.conflict_report && latest.conflict_report.length > 0 && (
                    <div className="mt-3 border-t border-line pt-3">
                      <div className="text-[13px] font-medium text-ink">Conflict report — {latest.conflict_report.length} unplaced</div>
                      <ul className="mt-1 space-y-1.5">
                        {latest.conflict_report.map((c) => (
                          <li key={c.session_key} className="bg-warn-bg px-2.5 py-2 text-[13px]">
                            <span className="font-mono text-xs font-semibold text-warn-text">{c.session_key}</span>
                            <span className="text-warn-text"> — {c.reason}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/registry/editor" className="mt-3 inline-block text-[13px] text-indigo-deep hover:underline">
                        Open in editor to place by hand →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-muted">Run the solver to generate your first draft. The Python worker in solver/ picks up queued jobs.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
