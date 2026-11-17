import Link from "next/link";
import { Logo } from "@/components/brand";

const NEED = [
  "Last semester’s timetable",
  "Your room list with capacities",
  "Your course list with lecturers",
  "Where student course registrations are kept",
];

const GET = [
  "A timetable with no lecturer, room or student clashes",
  "Classes at their full required length",
  "A short, readable list of anything that needs a decision",
  "A published timetable your students and lecturers can open on their phones",
];

export default function ForInstitutions() {
  return (
    <div className="min-h-svh bg-page">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-body md:flex" aria-label="Primary">
          <Link href="/about" className="transition-colors hover:text-heading">About</Link>
          <Link href="/features" className="transition-colors hover:text-heading">Features</Link>
          <Link href="/for-institutions" className="font-medium text-heading">For institutions</Link>
        </nav>
        <Link href="/get-started" className="btn-press inline-flex h-9 items-center rounded-lg bg-sidebar px-4 text-[13px] font-semibold text-white hover:opacity-90">
          Get started
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-heading">Built for the people who run the timetable</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-body">Wakati is for registries, academic offices and faculty coordinators who place classes for hundreds or thousands of students every semester.</p>

        <h2 className="mt-8 text-xl font-bold text-heading">What you need to start</h2>
        <ul className="mt-3 space-y-2">
          {NEED.map((n) => (
            <li key={n} className="rounded-xl border border-cardline bg-card px-4 py-3 text-[14px] text-heading">• {n}</li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-body">That is enough to run a first generation and compare it with your current timetable.</p>

        <h2 className="mt-8 text-xl font-bold text-heading">What you get</h2>
        <ul className="mt-3 space-y-2">
          {GET.map((n) => (
            <li key={n} className="rounded-xl border border-cardline bg-card px-4 py-3 text-[14px] text-heading">• {n}</li>
          ))}
        </ul>

        <h2 className="mt-8 text-xl font-bold text-heading">Your data</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-body">Each institution’s data is kept separate. Student information is used only for timetabling.</p>

        <div className="mt-8 rounded-xl border border-cardline bg-card p-6 text-center">
          <p className="text-[14px] text-body">Talk to us. Tell us how many courses and rooms you manage and we will tell you what a first run looks like.</p>
          <Link href="/create-institution" className="btn-press mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            Create your institution
          </Link>
        </div>
      </main>
    </div>
  );
}
