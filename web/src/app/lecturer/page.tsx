import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";

export default function LecturerHome() {
  return (
    <Shell role="lecturer" active="/lecturer">
      <PageHeader title="Good morning, Dr. Mensah" sub="Tuesday 11 Nov · Semester week 8" />
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Next class</div>
          <div className="px-4 py-3">
            <div className="text-[15px] font-semibold text-ink">CS302 — Algorithms</div>
            <div className="mt-0.5 text-[13px] text-muted">Today 10:20–11:20 · L-1 · Theory · BSc CS 300</div>
            <Link href="/lecturer/timetable" className="mt-2 inline-block text-[13px] text-indigo-deep hover:underline">
              Full timetable →
            </Link>
          </div>
        </section>
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Availability</div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] text-body">Semester 1 window closes <strong>Fri 20 Nov</strong></span>
            <StatusBadge tone="warn">Not submitted</StatusBadge>
          </div>
          <div className="px-4 pb-3">
            <Link href="/lecturer/availability" className="text-[13px] text-indigo-deep hover:underline">
              Fill in your grid →
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
