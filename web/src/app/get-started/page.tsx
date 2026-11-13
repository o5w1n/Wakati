import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { Logo } from "@/components/brand";

const CARDS = [
  {
    href: "/create-institution",
    icon: Building2,
    title: "Create Institution",
    body: "Set up your institution on Wakati.",
  },
  {
    href: "/signup/request",
    icon: Users,
    title: "Find / Join Institution",
    body: "Request to join an existing institution.",
  },
];

export default function GetStarted() {
  return (
    <div className="min-h-screen bg-page">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Logo />
        <Link href="/" className="text-sm text-body transition-colors hover:text-heading">
          Back to home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 text-center">
        <h1 className="text-[32px] font-bold tracking-tight text-heading">Get Started</h1>
        <p className="mt-2 text-sm text-body">Choose how you want to join Wakati.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex flex-col items-center rounded-xl border border-cardline bg-card px-6 py-10 transition-colors hover:border-primary"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white" aria-hidden>
                <c.icon size={24} strokeWidth={2} />
              </span>
              <span className="mt-4 text-[17px] font-bold text-heading">{c.title}</span>
              <span className="mt-1.5 text-[13px] leading-relaxed text-body">{c.body}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
