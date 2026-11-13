import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, Field, StatusBadge } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { createSemester, setSemesterStatus } from "@/app/actions/semesters";

export const instant = false;

export default async function RegistrySettings() {
  await connection();
  const sb = await supabaseServer();
  const { data: semesters } = await sb.from("semesters").select("id,name,status,teaching_days").order("created_at", { ascending: false });
  const sems = (semesters ?? []) as { id: string; name: string; status: string; teaching_days: number[] }[];
  const active = sems[0];

  return (
    <Shell role="registry" active="/registry/settings">
      <PageHeader title="Settings" sub="Semesters, time grids, solver rules. The grid is yours — not fixed Mon–Fri." />
      <div className="grid max-w-2xl gap-3">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Semesters</div>
          {sems.length === 0 ? (
            <p className="text-[13px] text-muted">No semesters yet. Create the first one below — it gets the default Mon–Fri 9-period grid and starter rule weights.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {sems.map((s) => (
                <li key={s.id} className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-0">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge tone={s.status === "published" ? "ok" : s.status === "setup" ? "neutral" : "accent"}>{s.status}</StatusBadge>
                    <form action={async () => { await setSemesterStatus(s.id, "availability"); }}>
                      <button className="text-indigo-deep hover:underline">→ availability</button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form action={async (f: FormData) => { await createSemester(f); }} className="flex gap-2">
            <input name="name" required placeholder="2026/27 Semester 1" className={inputCls} />
            <button className={btnPrimaryCls}>New semester</button>
          </form>
        </section>
        {active && (
          <section className="border border-line bg-paper p-4">
            <div className="mb-4 text-sm font-medium text-ink">Time grid — {active.name}</div>
            <p className="text-[13px] text-muted">
              Teaching days: {(active.teaching_days ?? []).join(", ")}. Edit the grid by importing periods.csv
              from Master Data, or reseed below.
            </p>
          </section>
        )}
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Solver rules</div>
          <div className="space-y-2 text-[13px]">
            {[
              ["H1–H12", "Hard constraints", "always on — violations block publish"],
              ["P1 ±15", "Preferred windows", "lecturer preference weight"],
              ["P5 ≤ 6", "Max periods per day", "per lecturer"],
              ["P6 ≤ 3", "Max consecutive", "before a forced break"],
            ].map(([code, name, note]) => (
              <div key={code} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                <span><span className="font-mono text-xs text-muted">{code}</span> <span className="ml-1 font-medium text-ink">{name}</span></span>
                <span className="text-muted">{note}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Full per-semester weights live in semester_rules — tunable without code changes.</p>
        </section>
      </div>
    </Shell>
  );
}
