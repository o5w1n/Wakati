import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge } from "@/components/ui";

export default function HodHome() {
  return (
    <Shell role="hod" active="/hod">
      <PageHeader title="Computer Science" sub="Head of Department · Semester 1 2026/27 · BSc CS 300 + 400" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Lecturers" value="12" sub="9 submitted availability" />
        <MetricCard label="Courses" value="14" sub="4 core · 10 elective" />
        <MetricCard label="Sessions" value="31" sub="all placed in v8 draft" />
        <MetricCard label="Clashes" value="0 hard" sub="1 soft preference" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Needs your attention</div>
          <div className="divide-y divide-line">
            <div className="flex items-center justify-between px-4 py-3 text-[13px]">
              <span>3 lecturers haven't submitted availability <span className="text-muted">· closes Fri 20 Nov</span></span>
              <Link href="/hod/availability" className="shrink-0 text-indigo-deep hover:underline">Remind →</Link>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-[13px]">
              <span>ML401 last-period slot <StatusBadge tone="warn">soft preference</StatusBadge></span>
              <Link href="/hod/timetable" className="shrink-0 text-indigo-deep hover:underline">Review →</Link>
            </div>
          </div>
        </section>
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Timetable status</div>
          <div className="px-4 py-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-body">v8 draft under Registry review</span>
              <StatusBadge tone="warn">Under review</StatusBadge>
            </div>
            <p className="mt-2 text-muted">Your department's sessions are all placed. Registry publishes — you'll be notified when v8 goes live.</p>
            <Link href="/hod/timetable" className="mt-2 inline-block text-indigo-deep hover:underline">
              View department timetable →
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
