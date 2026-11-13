import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand";

const CHECKS = ["2-period sessions", "Fast generation", "Clear conflict reasons"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-page">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-body md:flex" aria-label="Primary">
          <Link href="#about" className="transition-colors hover:text-heading">About</Link>
          <Link href="#features" className="transition-colors hover:text-heading">Features</Link>
          <Link href="#institutions" className="transition-colors hover:text-heading">For Institutions</Link>
        </nav>
        <Link
          href="/get-started"
          className="inline-flex h-9 items-center rounded-lg bg-sidebar px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Get Started
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-[40px] font-bold leading-[1.08] tracking-tight text-heading md:text-[56px]">
              FET, but <span className="text-primary">better.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-body">
              Generate clash-free lecture timetables in minutes, with full control.
            </p>
            <ul className="mt-5 space-y-2.5">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-center gap-2.5 text-sm text-heading">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary" aria-hidden>
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link
                href="/create-institution"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Create Your Institution <span aria-hidden>→</span>
              </Link>
            </div>
            <Link href="#features" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Learn more ↓
            </Link>
          </div>

          <div className="relative hidden overflow-visible md:block" aria-hidden>
            <div className="absolute -left-10 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-lavender/70" />
            <div className="relative ml-16 h-[420px] overflow-hidden rounded-l-3xl bg-gradient-to-br from-sidebar via-sidebar to-primary">
              {/* placeholder campus photo — replace with public/images/campus.jpg */}
              <div className="absolute inset-0 bg-gradient-to-t from-sidebar/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-semibold">Academic City University</p>
                <p className="text-xs text-white/70">Timetabled with Wakati</p>
              </div>
              {/* simple building silhouette */}
              <svg viewBox="0 0 400 420" className="absolute inset-0 h-full w-full text-white/25" fill="currentColor" aria-hidden>
                <rect x="120" y="80" width="180" height="340" rx="4" />
                <rect x="40" y="160" width="80" height="260" rx="4" opacity="0.7" />
                <rect x="300" y="160" width="80" height="260" rx="4" opacity="0.7" />
              </svg>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
