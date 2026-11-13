import Link from "next/link";
import { Clock } from "lucide-react";
import { Logo } from "@/components/brand";
import { btnSecondaryCls } from "@/components/ui";

export default function Pending() {
  return (
    <div className="min-h-screen bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-sm px-6 pt-10 text-center">
        <div className="rounded-xl border border-cardline bg-card p-8">
          <Clock size={22} className="mx-auto text-muted" strokeWidth={1.5} aria-hidden />
          <h1 className="mt-3 text-xl font-bold text-heading">Request pending</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-body">
            Your request to join is with the Registry. You’ll get access as soon as they approve it.
          </p>
          <div className="mt-6">
            <Link href="/login" className={btnSecondaryCls}>Back to sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
