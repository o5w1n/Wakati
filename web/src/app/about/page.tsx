import Link from "next/link";
import { Logo } from "@/components/brand";

export default function About() {
  return (
    <div className="min-h-svh bg-page">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-body md:flex" aria-label="Primary">
          <Link href="/about" className="font-medium text-heading">About</Link>
          <Link href="/features" className="transition-colors hover:text-heading">Features</Link>
          <Link href="/for-institutions" className="transition-colors hover:text-heading">For institutions</Link>
        </nav>
        <Link href="/get-started" className="btn-press inline-flex h-9 items-center rounded-lg bg-sidebar px-4 text-[13px] font-semibold text-white hover:opacity-90">
          Get started
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-heading">Why we built Wakati</h1>
        <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-body">
          <p>At Academic City, the semester timetable was placed by hand. Nothing checked it, so clashes appeared once teaching began. Two-hour classes were cut to one hour when no clean block could be found. A change to one room meant moving other classes by hand.</p>
          <p>We built Wakati so that the checking is done by the system and the decisions stay with the registry. It is made for universities in Ghana and across Africa, starting with Academic City.</p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/create-institution" className="btn-press inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            Create your institution
          </Link>
        </div>
      </main>
    </div>
  );
}
