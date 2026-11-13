import Link from "next/link";
import { ArrowRight, CalendarCheck, Grid3X3, Users } from "lucide-react";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { TimetableGrid, SAMPLE_DAYS, SAMPLE_PERIODS } from "@/components/timetable";

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-[15px] font-semibold tracking-tight text-ink">Wakati</span>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-2 text-[13px] text-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className={btnSecondaryCls}>
              Find your institution
            </Link>
            <Link href="/signup?type=create" className={btnPrimaryCls}>
              Create institution
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 md:py-24">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink md:text-[40px] md:leading-[1.15]">
            FET, but better.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Clash-free lecture timetables for your university — generated in minutes,
            fixed by drag and drop, published to every student and lecturer. Every
            conflict explained in plain language.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/signup?type=create" className={btnPrimaryCls}>
              Create your institution <ArrowRight size={15} />
            </Link>
            <Link href="/signup" className={btnSecondaryCls}>
              Find your institution
            </Link>
          </div>
        </section>

        <section className="grid gap-px border border-line bg-line md:grid-cols-3">
          {[
            { icon: CalendarCheck, t: "Generate", d: "CP-SAT solver places every session. Unplaced sessions get plain-language reasons, not error codes." },
            { icon: Grid3X3, t: "Edit by drag and drop", d: "Green is valid, amber breaks a preference, red breaks a hard rule — with the reason on hover." },
            { icon: Users, t: "Publish to everyone", d: "Students and lecturers see personal timetables on their phones. Exports in the familiar cell layout." },
          ].map((f) => (
            <div key={f.t} className="bg-paper p-6">
              <f.icon size={18} strokeWidth={1.75} className="text-indigo-deep" />
              <div className="mt-3 text-[15px] font-semibold text-ink">{f.t}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </section>

        <section className="py-12">
          <h2 className="text-lg font-semibold text-ink">The timetable, as your Registry already knows it</h2>
          <p className="mt-1 text-[13px] text-muted">
            Course codes, titles, tags, lecturer, room in bold. Monday to Friday — or your own grid.
          </p>
          <div className="mt-4">
            <TimetableGrid days={SAMPLE_DAYS} periods={SAMPLE_PERIODS} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-muted">
          <span>Wakati — university timetabling</span>
          <span>Built for Academic City, open to every institution</span>
        </div>
      </footer>
    </div>
  );
}
