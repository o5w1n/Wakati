import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";

const TODAY = [
  { t: "08:00–10:10", code: "CS4135", title: "Computer Security", room: "L-3", lecturer: "Prof. Yamak", tag: "Core" },
  { t: "10:20–11:20", code: "ML401", title: "Machine Learning", room: "Lab-B", lecturer: "Ms. Adjunct", tag: "Elective" },
];

export default function StudentHome() {
  return (
    <Shell role="student" active="/student">
      <PageHeader title="Good morning, Ama" sub="Tuesday 11 Nov · BSc CS 400" />
      <section className="border border-line bg-paper">
        <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Today's classes</div>
        <ul className="divide-y divide-line">
          {TODAY.map((c) => (
            <li key={c.code} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] text-muted">{c.t}</div>
                <div className="truncate text-sm font-medium text-ink">{c.code} — {c.title}</div>
                <div className="text-[13px] text-muted">{c.lecturer} · <strong className="text-ink">{c.room}</strong></div>
              </div>
              <StatusBadge tone={c.tag === "Elective" ? "accent" : "neutral"}>{c.tag}</StatusBadge>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-2.5">
          <Link href="/student/timetable" className="text-[13px] text-indigo-deep hover:underline">
            Weekly timetable →
          </Link>
        </div>
      </section>
    </Shell>
  );
}
