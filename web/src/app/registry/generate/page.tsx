import Link from "next/link";
import { CheckCircle2, AlertTriangle, Play } from "lucide-react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnPrimaryCls } from "@/components/ui";

const PRECHECK = [
  { ok: true, text: "Room capacity: largest lecture room seats 200, largest class needs 95." },
  { ok: true, text: "Labs: 4 practical sessions, 3 computer labs available." },
  { ok: false, text: "PHYS201-L1: no lecture room seats 260 (largest holds 200). Fix capacity or split the cohort." },
  { ok: true, text: "Lecturer load: all within available periods." },
];

const CONFLICTS = [
  { key: "PH301-P1", reason: "No lab free for 2 periods when all CS300 students and Dr. Owusu are free." },
  { key: "EC402-T1", reason: "Dr. Adjunct has 4 free periods but needs 6 to teach this plus CS201." },
];

export default function Generate() {
  return (
    <Shell role="registry" active="/registry/generate">
      <PageHeader
        title="Generate"
        sub="Pre-check, solve, review. Partial results never publish silently."
        actions={
          <button className={btnPrimaryCls}><Play size={15} /> Run solver</button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">
            Pre-check — impossible inputs before generating
          </div>
          <ul className="px-4 py-2">
            {PRECHECK.map((c) => (
              <li key={c.text} className="flex items-start gap-2 py-2 text-[13px]">
                {c.ok
                  ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-ok-text" />
                  : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-bad-text" />}
                <span className={c.ok ? "text-body" : "text-ink"}>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-medium text-ink">Latest run — Draft v3</span>
            <StatusBadge tone="ok">score 94.2</StatusBadge>
          </div>
          <div className="px-4 py-3">
            <div className="h-1.5 w-full bg-canvas-2">
              <div className="h-1.5 w-[94%] bg-indigo-deep" />
            </div>
            <div className="mt-2 text-xs text-muted">148 of 150 sessions placed · CP-SAT · 3m 12s</div>
            <div className="mt-3 border-t border-line pt-3">
              <div className="text-[13px] font-medium text-ink">Conflict report — 2 unplaced</div>
              <ul className="mt-1 space-y-1.5">
                {CONFLICTS.map((c) => (
                  <li key={c.key} className="bg-warn-bg px-2.5 py-2 text-[13px]">
                    <span className="font-mono text-xs font-semibold text-warn-text">{c.key}</span>
                    <span className="text-warn-text"> — {c.reason}</span>
                  </li>
                ))}
              </ul>
              <Link href="/registry/editor" className="mt-3 inline-block text-[13px] text-indigo-deep hover:underline">
                Open in editor to place by hand →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
