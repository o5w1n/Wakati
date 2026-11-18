import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { createSemester, setSemesterStatus, setRuleEnabled, setRuleWeight } from "@/app/actions/semesters";

export const instant = false;

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RULE_NAMES: Record<string, string> = {
  H1: "Lecturer clash",
  H2: "Room clash",
  H3: "Cohort clash",
  H4: "Elective overlap",
  H5: "Session hours",
  H6: "Room capacity",
  H7: "Room type",
  H8: "Lecturer availability",
  H9: "Consecutive periods",
  H10: "Sessions per week",
  H11: "Level grouping",
  H12: "Blocked slots",
  P1: "Preferred windows",
  P2: "Morning preference",
  P3: "Spread across week",
  P4: "Room stability",
  P5: "Max periods per day",
  P6: "Max consecutive blocks",
  P7: "Free day",
  P8: "Back-to-back",
  P9: "Department clustering",
};

const NEXT_STATUS: Record<string, { to: string; label: string } | null> = {
  setup: { to: "availability", label: "→ availability" },
  availability: { to: "solving", label: "→ solving" },
  solving: null,
  review: null,
  published: { to: "review", label: "reopen → review" },
  closed: null,
};

export default async function RegistrySettings() {
  await connection();
  const sb = await supabaseServer();
  const { data: semesters } = await sb
    .from("semesters")
    .select("id,name,status,teaching_days")
    .order("created_at", { ascending: false });
  const sems = (semesters ?? []) as { id: string; name: string; status: string; teaching_days: number[] }[];
  const active = sems[0];
  const { data: rules } = active
    ? await sb.from("semester_rules").select("rule_id,enabled,weight").eq("semester_id", active.id).order("rule_id")
    : { data: null };
  const ruleList = (rules ?? []) as { rule_id: string; enabled: boolean; weight: number }[];

  return (
    <Shell role="registry" active="/registry/settings">
      <PageHeader
        title="Settings"
        sub="Semesters, time grids, solver rules. The grid is yours — not fixed Mon–Fri."
      />
      <div className="grid max-w-2xl gap-3">
        <section className="rounded-xl border border-cardline bg-card p-4">
          <div className="mb-4 text-sm font-medium text-heading">Semesters</div>
          {sems.length === 0 ? (
            <p className="text-[13px] text-muted">
              No semesters yet. Create the first one below — it gets the default Mon–Fri 9-period grid and starter rule
              weights.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {sems.map((s) => {
                const next = NEXT_STATUS[s.status] ?? null;
                async function advance() {
                  "use server";
                  if (next) await setSemesterStatus(s.id, next.to);
                }
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b border-cardline py-2 text-[13px] last:border-0"
                  >
                    <span className="font-medium text-heading">{s.name}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge
                        tone={s.status === "published" ? "ok" : s.status === "setup" ? "neutral" : "accent"}
                      >
                        {s.status}
                      </StatusBadge>
                      {next && s.id === active?.id && (
                        <form action={advance}>
                          <button className="text-primary hover:underline">{next.label}</button>
                        </form>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <form action={createSemester} className="flex gap-2">
            <input name="name" required placeholder="2026/27 Semester 1" className={inputCls} />
            <button className={btnPrimaryCls}>New semester</button>
          </form>
        </section>

        {active && (
          <section className="rounded-xl border border-cardline bg-card p-4">
            <div className="mb-4 text-sm font-medium text-heading">Time grid — {active.name}</div>
            <p className="text-[13px] text-muted">
              Teaching days: {(active.teaching_days ?? []).map((d) => DAY_NAMES[d] ?? d).join(", ")}. Edit the grid by
              importing periods.csv from Master Data.
            </p>
          </section>
        )}

        {active && ruleList.length > 0 && (
          <section className="rounded-xl border border-cardline bg-card p-4">
            <div className="mb-1 text-sm font-medium text-heading">Solver rules — {active.name}</div>
            <p className="mb-3 text-xs text-muted">
              Hard rules stay on and block publish. Preference weights tune the solver.
            </p>
            <div className="space-y-2 text-[13px]">
              {ruleList.map((r) => {
                async function toggleRule() {
                  "use server";
                  await setRuleEnabled(active.id, r.rule_id, !r.enabled);
                }
                async function saveWeight(formData: FormData) {
                  "use server";
                  await setRuleWeight(active.id, r.rule_id, Number(formData.get("weight")));
                }
                return (
                  <div
                    key={r.rule_id}
                    className="flex items-center justify-between gap-2 border-b border-cardline py-2 last:border-0"
                  >
                    <span>
                      <span className="font-mono text-xs text-muted">{r.rule_id}</span>{" "}
                      <span className="ml-1 font-medium text-heading">{RULE_NAMES[r.rule_id] ?? r.rule_id}</span>
                    </span>
                    {r.rule_id.startsWith("H") ? (
                      <span className="text-xs text-muted">always on</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <form action={toggleRule}>
                          <button className="text-xs text-primary hover:underline">{r.enabled ? "on" : "off"}</button>
                        </form>
                        <form action={saveWeight} className="flex items-center gap-1">
                          <input
                            name="weight"
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={r.weight}
                            aria-label={`${r.rule_id} weight`}
                            className="h-7 w-16 rounded-lg border border-cardline bg-card px-2 text-xs text-heading outline-none focus:border-primary"
                          />
                          <button className="text-xs text-primary hover:underline">set</button>
                        </form>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
