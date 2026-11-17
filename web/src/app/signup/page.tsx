"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand";
import { Field, inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { registerUniversity, acceptInvite } from "@/app/actions/auth";

const initial = { error: "" } as { error?: string };

function RegisterForm() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await registerUniversity(form)) ?? initial,
    initial
  );
  return (
    <form action={action} className="mt-4 space-y-4">
      <Field label="Institution name">
        <input name="name" required placeholder="Academic City University" className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Short code">
          <input name="short_code" required placeholder="ACity" className={inputCls} maxLength={8} />
        </Field>
        <Field label="Domain (optional)">
          <input name="domain" placeholder="acity.edu.gh" className={inputCls} />
        </Field>
      </div>
      <Field label="Your name">
        <input name="admin_name" required placeholder="Registry Admin" className={inputCls} />
      </Field>
      {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
      <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
        {pending ? "Registering…" : <>Register institution <ArrowRight size={15} aria-hidden /></>}
      </button>
    </form>
  );
}

function InviteForm() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await acceptInvite(form)) ?? initial,
    initial
  );
  return (
    <form action={action} className="mt-4 space-y-4">
      <Field label="Invite token" hint="From your admin's email.">
        <input name="token" placeholder="paste token…" className={`${inputCls} font-mono`} />
      </Field>
      {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimaryCls} flex-1`}>
          {pending ? "Accepting…" : "Accept invite"}
        </button>
        <Link href="/signup/request" className={`${btnSecondaryCls} flex-1`}>Request to join</Link>
      </div>
    </form>
  );
}

export default function Signup() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Logo />
        <Link href="/" className="text-sm text-body transition-colors hover:text-heading">
          Back to home
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-6 pb-16">
        <h1 className="text-center text-[28px] font-bold tracking-tight text-heading">Get Started</h1>
        <p className="mt-1.5 text-center text-sm text-body">Choose how you want to join Wakati.</p>
        <div className="mt-8 space-y-4">
          <section className="rounded-xl border border-cardline bg-card p-6">
            <h2 className="text-[15px] font-bold text-heading">Create your institution</h2>
            <p className="mt-1 text-[13px] text-body">Register a new university. You become its timetable admin.</p>
            <RegisterForm />
          </section>
          <section className="rounded-xl border border-cardline bg-card p-6">
            <h2 className="text-[15px] font-bold text-heading">Find your institution</h2>
            <p className="mt-1 text-[13px] text-body">Already on Wakati? Join with an invite token or request access.</p>
            <InviteForm />
          </section>
        </div>
      </main>
    </div>
  );
}
