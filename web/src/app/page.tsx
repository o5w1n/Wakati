import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand";

const POINTS = [
  "Two-hour classes stay two hours",
  "No lecturer, room or student group booked twice",
  "A plain-language reason for anything it cannot place",
];

const WHAT = [
  [
    "Builds the whole timetable",
    "Add your courses, lecturers and rooms. Wakati places every session so that no lecturer, room or student group is in two places at once, across every programme and level.",
  ],
  [
    "Keeps two-hour classes whole",
    "Class length is a requirement, not a hope. A two-period class gets two consecutive periods, with the break kept inside it, or Wakati tells you why it could not.",
  ],
  [
    "Explains what it cannot place",
    "No vague error codes. You get a sentence: “No lab is free for two periods when all CS 300 students and Dr Mensah are free.” Then you decide what to change.",
  ],
  [
    "Starts from lecturer availability",
    "Lecturers mark when they are available, preferred or unavailable before anything is generated. The first draft already fits, so you are not fixing it by hand afterwards.",
  ],
  [
    "Fits electives into fewer slots",
    "Two Level 400 electives can share a slot when no student takes both. Wakati reads who chose what, so electives stop taking up the whole week and core classes get room.",
  ],
  [
    "Edit by dragging",
    "Move a class to another slot or room. Green means it fits, amber means it breaks a preference, red means it breaks a rule. Hover to see which rule and why.",
  ],
];

const STEPS = [
  [
    "Set up once.",
    "Add your lecturers, rooms, courses and groups. They stay saved. Next semester, you start from what you already have.",
  ],
  [
    "Collect availability.",
    "Open a window and lecturers fill in a weekly grid. You see who has submitted and who has not.",
  ],
  [
    "Generate and review.",
    "Wakati checks your inputs first, then builds the timetable. You get a quality score and a list of anything it could not place.",
  ],
  [
    "Publish.",
    "Review, adjust, then publish. Students and lecturers see their own timetables straight away, on a phone or a computer.",
  ],
];

const AFTER = [
  [
    "A lecturer cancels a class.",
    "They do it in Wakati, with a reason. The room shows as free for that day, and the students in that class are told.",
  ],
  [
    "An emergency class comes up.",
    "Registry picks a date and time and sees every room that is free. Wakati also shows whether the lecturer and the students are free, so you do not find the clash afterwards.",
  ],
  [
    "Anyone can see which rooms are free.",
    "Students and lecturers can check a room for a given period. They cannot book it, and the page says so.",
  ],
  [
    "Every change is on record.",
    "After publishing, each change is saved with who made it, when and why. You can compare two versions and see exactly which classes moved.",
  ],
];

const WHO = [
  [
    "Registry and timetable offices",
    "Set up the semester, generate, edit and publish. Find rooms for emergency classes. See every cohort, lecturer and room.",
  ],
  [
    "Lecturers",
    "Set your availability once a semester. See your own timetable and any room’s timetable. Cancel a class when you cannot teach it.",
  ],
  [
    "Students",
    "See your timetable for your programme, electives and group only. Check which rooms are free. Open it on a phone without eating your data.",
  ],
];

const FAQS = [
  [
    "Can we import what we already have?",
    "Yes. Lecturers, rooms, courses and student electives import from Excel or CSV. If a row has a problem, you are told which row and what is wrong.",
  ],
  [
    "What if a full timetable is not possible?",
    "Wakati places as much as it can and lists every class it could not place, with the reason for each. Nothing is silently dropped.",
  ],
  [
    "Can we change the timetable after publishing?",
    "Yes. Every change is saved as a new version with a reason, and the affected students and lecturers are notified.",
  ],
  [
    "Can students or lecturers book rooms?",
    "No. They can see which rooms are free for a period. Only Registry can schedule a room for an extra class.",
  ],
  [
    "Does it work on phones?",
    "Student and lecturer views do, and they are kept small for slow connections. The timetable editor is for desktop.",
  ],
  [
    "How is student data used?",
    "Only to build and show timetables. Wakati follows Ghana’s Data Protection Act, 2012 (Act 843).",
  ],
  [
    "Does it replace our student portal?",
    "No. Wakati reads from and shows timetables in your portal where it can connect, and works as its own web page where it cannot.",
  ],
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12">
      {eyebrow && (
        <p className="text-[13px] font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 max-w-xl text-2xl font-bold tracking-tight text-heading">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-svh bg-page">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav
          className="hidden items-center gap-7 text-sm text-body md:flex"
          aria-label="Primary"
        >
          <Link href="/about" className="transition-colors hover:text-heading">
            About
          </Link>
          <Link
            href="/features"
            className="transition-colors hover:text-heading"
          >
            Features
          </Link>
          <Link
            href="/for-institutions"
            className="transition-colors hover:text-heading"
          >
            For institutions
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-body hover:text-heading">
            Sign in
          </Link>
          <Link
            href="/get-started"
            className="btn-press inline-flex h-9 items-center rounded-lg bg-sidebar px-4 text-[13px] font-semibold text-white hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-primary">
              For university registries and timetable offices
            </p>
            <h1 className="mt-2 text-[40px] font-bold leading-[1.08] tracking-tight text-heading md:text-[52px]">
              A clash-free semester timetable, built in minutes.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-body">
              Wakati places every class using your courses, lecturers and rooms,
              and checks every rule as it goes. When something cannot fit, it
              tells you exactly why.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/create-institution"
                className="btn-press inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Create your institution
              </Link>
              <Link
                href="/features"
                className="text-sm font-medium text-primary hover:underline"
              >
                See how it works
              </Link>
            </div>
            <ul className="mt-5 space-y-2.5">
              {POINTS.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-2.5 text-sm text-heading"
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full bg-primary"
                    aria-hidden
                  >
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="relative hidden overflow-visible md:block"
            aria-hidden
          >
            <div className="absolute -left-10 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-lavender/70" />
            <div className="relative ml-16 h-[420px] overflow-hidden rounded-l-3xl bg-gradient-to-br from-sidebar via-sidebar to-primary">
              <svg
                viewBox="0 0 400 420"
                className="absolute inset-0 h-full w-full text-white/25"
                fill="currentColor"
                aria-hidden
              >
                <rect x="120" y="80" width="180" height="340" rx="4" />
                <rect
                  x="40"
                  y="160"
                  width="80"
                  height="260"
                  rx="4"
                  opacity="0.7"
                />
                <rect
                  x="300"
                  y="160"
                  width="80"
                  height="260"
                  rx="4"
                  opacity="0.7"
                />
              </svg>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-semibold">
                  Academic City University
                </p>
                <p className="text-xs text-white/70">Timetabled with Wakati</p>
              </div>
            </div>
          </div>
        </section>

        <Section title="Hand-built timetables fail in the same few places">
          <div className="max-w-2xl space-y-3 text-[14px] leading-relaxed text-body">
            <p>
              Most registries still place classes one at a time in a
              spreadsheet. Nothing checks the work as it grows, so clashes turn
              up in the first week of teaching.
            </p>
            <p>
              When no clean two-hour block can be found, a two-hour class is
              quietly cut to one. Lecturers’ availability is collected by phone
              and forgotten by the time the grid is built. And one room change
              can mean redoing half the week.
            </p>
            <p className="font-medium text-heading">
              Wakati takes over the part that is slow and easy to get wrong, and
              leaves the decisions with you.
            </p>
          </div>
        </Section>

        <Section title="Everything between your course list and a published timetable">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WHAT.map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl border border-cardline bg-card p-5"
              >
                <div className="text-[15px] font-bold text-heading">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="From setup to published in four steps">
          <ol className="grid gap-4 md:grid-cols-2">
            {STEPS.map(([t, d], i) => (
              <li
                key={t}
                className="rounded-xl border border-cardline bg-card p-5"
              >
                <div className="text-[13px] font-semibold text-primary">
                  Step {i + 1}
                </div>
                <div className="mt-0.5 text-[15px] font-bold text-heading">
                  {t}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  {d}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="The timetable keeps working after week one">
          <div className="grid gap-4 md:grid-cols-2">
            {AFTER.map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl border border-cardline bg-card p-5"
              >
                <div className="text-[15px] font-bold text-heading">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="One system, three views">
          <div className="grid gap-4 md:grid-cols-3">
            {WHO.map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl border border-cardline bg-card p-5"
              >
                <div className="text-[15px] font-bold text-heading">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Exam timetables from the same data">
          <p className="max-w-2xl text-[14px] leading-relaxed text-body">
            You have already entered the courses, rooms and student
            registrations. Wakati uses them to build the exam timetable too: no
            student with two papers in one period, no room or invigilator booked
            twice, large exams split across rooms where needed.
          </p>
        </Section>

        <Section title="Built for more than one university">
          <p className="max-w-2xl text-[14px] leading-relaxed text-body">
            Each institution has its own days, periods, rooms and people, kept
            apart from every other institution on Wakati. One institution can
            never see another’s data.
          </p>
        </Section>

        <Section title="Frequently asked questions">
          <div className="grid gap-4 md:grid-cols-2">
            {FAQS.map(([q, a]) => (
              <div
                key={q}
                className="rounded-xl border border-cardline bg-card p-5"
              >
                <div className="text-[14px] font-bold text-heading">{q}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <section className="py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-heading">
            See your own timetable built
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-body">
            Create your institution, import your data and generate a first
            draft. If something cannot be placed, you will know why.
          </p>
          <Link
            href="/create-institution"
            className="btn-press mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Create your institution
          </Link>
        </section>
      </main>

      <footer className="border-t border-cardline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[13px] text-body">
          <span className="font-medium text-heading">
            Wakati: timetabling for universities.
          </span>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            <Link href="/about" className="hover:text-heading">
              About
            </Link>
            <Link href="/features" className="hover:text-heading">
              Features
            </Link>
            <Link href="/for-institutions" className="hover:text-heading">
              For institutions
            </Link>
            <Link href="/login" className="hover:text-heading">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
