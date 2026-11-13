"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";
import { signIn } from "@/app/actions/auth";

const initial = { error: "" } as { error?: string };

export default function Login() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await signIn(form)) ?? initial,
    initial
  );
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm border border-line bg-paper p-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">Wakati</Link>
        <h1 className="mt-4 text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-[13px] text-muted">Use your institution email address.</p>
        <form action={action} className="mt-6 space-y-4">
          <Field label="Email">
            <input name="email" type="email" required placeholder="you@university.edu" className={inputCls} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required className={inputCls} />
          </Field>
          {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
          <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <Link href="/signup" className="text-indigo-deep hover:underline">Create or join an institution</Link>
          <Link href="/reset" className="text-muted hover:text-ink">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
