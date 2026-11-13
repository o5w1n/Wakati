"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Field, inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { registerUniversity, acceptInvite } from "@/app/actions/auth";

const initial = { error: "" } as { error?: string };

function RegisterForm() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await registerUniversity(form)) ?? initial,
    initial
  );
  return (
    <form action={action} className="mt-4 space-y-3">
      <Field label="Institution name">
        <input name="name" required placeholder="Academic City University" className={inputCls} />
      </Field>
      <Field label="Short code" hint="Used in URLs and imports, e.g. AC.">
        <input name="short_code" required placeholder="AC" className={`${inputCls} uppercase`} maxLength={8} />
      </Field>
      <Field label="Email domain" hint="Students and lecturers sign up with this domain.">
        <input name="domain" placeholder="acity.edu.gh" className={inputCls} />
      </Field>
      <Field label="Your name">
        <input name="admin_name" required placeholder="Registry Admin" className={inputCls} />
      </Field>
      {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
      <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
        {pending ? "Registering…" : <>Register institution <ArrowRight size={15} /></>}
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
    <form action={action} className="mt-4 space-y-3">
      <Field label="Invite token" hint="From your admin's email. Leave blank to request access instead.">
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md border border-line bg-paper p-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">Wakati</Link>
        <h1 className="mt-4 text-xl font-semibold text-ink">Get started</h1>
        <div className="mt-6 grid gap-3">
          <section className="border border-line p-4">
            <div className="text-sm font-medium text-ink">Create your institution</div>
            <p className="mt-1 text-[13px] text-muted">
              Register a new university. You become its timetable admin.
            </p>
            <RegisterForm />
          </section>
          <section className="border border-line p-4">
            <div className="text-sm font-medium text-ink">Find your institution</div>
            <p className="mt-1 text-[13px] text-muted">
              Already on Wakati? Join with an invite token or request access.
            </p>
            <InviteForm />
          </section>
        </div>
      </div>
    </div>
  );
}
