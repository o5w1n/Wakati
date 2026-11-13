import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import Link from "next/link";

export default function RegistryDashboard() {
  return (
    <Shell role="registry" active="/registry">
      <PageHeader
        title="Dashboard"
        sub="Academic City · 2026/27 Semester 1"
        actions={
          <>
            <Link href="/registry/generate" className={btnSecondaryCls}>Pre-check</Link>
            <Link href="/registry/generate" className={btnPrimaryCls}>Generate timetable</Link>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Semester status" value="Availability" sub="Deadline Fri 20 Nov" />
        <MetricCard label="Availability submitted" value="41 / 58" sub="71% of lecturers" />
        <MetricCard label="Solve jobs" value="3" sub="Last: score 94.2" />
        <MetricCard label="Pending requests" value="6" sub="4 join · 2 change" />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">
            Availability progress
          </div>
          <div className="px-4 py-3">
            <div className="h-1.5 w-full bg-canvas-2">
              <div className="h-1.5 w-[71%] bg-indigo-deep" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>41 of 58 lecturers submitted</span>
              <Link href="/registry/availability" className="text-indigo-deep hover:underline">
                View who hasn't
              </Link>
            </div>
          </div>
        </section>

        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">
            Generation status
          </div>
          <ul className="divide-y divide-line px-4 text-[13px]">
            {[
              ["#42 · Draft v3", "94.2", "ok", "2 unplaced"],
              ["#41 · Draft v2", "88.0", "ok", "6 unplaced"],
              ["#40 · Draft v1", "—", "bad", "failed: H6"],
            ].map(([name, score, tone, note]) => (
              <li key={name} className="flex items-center justify-between py-2.5">
                <span className="text-body">{name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted">{note}</span>
                  <StatusBadge tone={tone as "ok" | "bad"}>{String(score)}</StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-line bg-paper lg:col-span-2">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">
            Outstanding tasks
          </div>
          <ul className="divide-y divide-line px-4 text-[13px]">
            <li className="flex items-center justify-between py-2.5">
              <span className="text-body">6 join requests awaiting review</span>
              <Link href="/registry/members" className="text-indigo-deep hover:underline">Review</Link>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-body">17 lecturers haven't submitted availability</span>
              <Link href="/registry/availability" className="text-indigo-deep hover:underline">Remind</Link>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-body">CRY402-T1 has a TBA lecturer — assign before publishing</span>
              <Link href="/registry/master" className="text-indigo-deep hover:underline">Assign</Link>
            </li>
          </ul>
        </section>
      </div>
    </Shell>
  );
}
