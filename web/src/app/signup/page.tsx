"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { Field, inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { acceptInvite } from "@/app/actions/auth";

const initial = { error: "" } as { error?: string };

function InviteForm() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await acceptInvite(form)) ?? initial,
    initial
  );
  return (
    <form action={action} className="mt-4 space-y-4">
      <Field label="Invite token" hint="From your admin's email. You must be signed in to accept.">
        <input name="token" placeholder="paste token…" className={`${inputCls} font-mono`} />
      </Field>
      {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimaryCls} flex-1`}>
          {pending ? "Accepting…" : "Accept invite"}
        </button>
        <Link href="/join" className={`${btnSecondaryCls} flex-1`}>Join with code</Link>
      </div>
    </form>
  );
}

export default function Signup() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Logo />
        <Link href="/get-started" className="text-sm text-body transition-colors hover:text-heading">
          Back
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-6 pb-16">
        <h1 className="text-center text-[28px] font-bold tracking-tight text-heading">Accept an invite</h1>
        <p className="mt-1.5 text-center text-sm text-body">Have an invite token? Sign in first, then paste it here. Otherwise join with your institution and access code.</p>
        <div className="mt-8 space-y-4">
          <section className="rounded-xl border border-cardline bg-card p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-heading">Invite token</h2>
            <InviteForm />
          </section>
          <section className="rounded-xl border border-cardline bg-card p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-heading">No token?</h2>
            <p className="mt-1 text-[13px] text-body">Use the institution code and your role access code (student/lecturer/HOD) from your Registry to create an account.</p>
            <Link href="/join" className={`${btnPrimaryCls} mt-4 inline-flex`}>Join with access code</Link>
          </section>
        </div>
      </main>
    </div>
  );
}
