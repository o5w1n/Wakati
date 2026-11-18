import Link from "next/link";
import { Logo } from "@/components/brand";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";

export default function GetStarted() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Logo />
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">Sign in</Link>
      </header>
      <main className="mx-auto max-w-xl px-6 pb-16">
        <h1 className="text-center text-[28px] font-bold tracking-tight text-heading">Get Started</h1>
        <p className="mt-1.5 text-center text-sm text-body">Create an institution (Registry) or join with your institution and access code.</p>
        <div className="mt-8 space-y-4">
          <section className="rounded-xl border border-cardline bg-card p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-heading">Create your institution</h2>
            <p className="mt-1 text-[13px] text-body">Register a new university/school, set an institution code, and create your admin account with a password. You become the timetable admin (Registry).</p>
            <Link href="/create-institution" className={`${btnPrimaryCls} mt-4 inline-flex`}>Create institution</Link>
          </section>
          <section className="rounded-xl border border-cardline bg-card p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-heading">Join with access code</h2>
            <p className="mt-1 text-[13px] text-body">Students, lecturers, and HODs: use your institution code and the access code given by the Registry to create your account. After joining you can sign in regularly.</p>
            <Link href="/join" className={`${btnSecondaryCls} mt-4 inline-flex`}>Join institution</Link>
          </section>
          <section className="rounded-xl border border-cardline bg-card p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-heading">Have an invite token?</h2>
            <p className="mt-1 text-[13px] text-body">If an admin sent you an email invite token, you can accept it after signing in.</p>
            <Link href="/signup" className="mt-4 inline-flex text-[13px] font-medium text-primary hover:underline">Accept invite token →</Link>
          </section>
        </div>
      </main>
    </div>
  );
}
