import Link from "next/link";
import { Logo } from "@/components/brand";

const PARTS: [string, string][] = [
  ["Set up.", "Semester days and periods, rooms with capacity and type, lecturers (full-time and adjunct), courses, groups, cohorts and electives. Import from Excel or CSV, or copy last semester."],
  ["Collect availability.", "A weekly grid in the same layout as the timetable. Lecturers mark each period available, preferred or unavailable, with an optional private reason. Quick buttons for “not Fridays” or “mornings only”."],
  ["Check before generating.", "Wakati finds impossible inputs first: a course that needs 120 seats when your largest room holds 80, or a lecturer with fewer free periods than classes."],
  ["Generate.", "Cross-listed courses, theory and practical sessions, groups, electives, locked sessions and lecturers still to be confirmed are all handled. You get a quality score."],
  ["Explain.", "Every unplaced class comes with the specific reason it could not fit."],
  ["Edit.", "Drag and drop with live colour checking, lock sessions you are happy with, undo and redo, and find the best alternative slot for a class."],
  ["Publish.", "Draft, under review, published. Compare any two versions and see which classes moved."],
  ["Day to day.", "Lecturers cancel a class for a day. Registry finds rooms for emergency classes. Anyone can check free rooms."],
  ["Exams.", "Exam periods, room capacity for exams, invigilators, and the same checking and publishing flow."],
  ["Export.", "PDF and Excel in the layout your students already know."],
];

export default function Features() {
  return (
    <div className="min-h-svh bg-page">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-body md:flex" aria-label="Primary">
          <Link href="/about" className="transition-colors hover:text-heading">About</Link>
          <Link href="/features" className="font-medium text-heading">Features</Link>
          <Link href="/for-institutions" className="transition-colors hover:text-heading">For institutions</Link>
        </nav>
        <Link href="/get-started" className="btn-press inline-flex h-9 items-center rounded-lg bg-sidebar px-4 text-[13px] font-semibold text-white hover:opacity-90">
          Get started
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="max-w-xl text-3xl font-bold tracking-tight text-heading">What Wakati does, in the order you use it</h1>
        <p className="mt-2 max-w-xl text-[14px] text-body">Each part works on the same saved data, so you enter your lecturers, rooms and courses once.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PARTS.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-cardline bg-card p-5">
              <div className="text-[15px] font-bold text-heading">{t}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-body">{d}</p>
            </div>
          ))}
        </div>
        <div className="py-10 text-center">
          <Link href="/create-institution" className="btn-press inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            Create your institution
          </Link>
        </div>
      </main>
    </div>
  );
}
