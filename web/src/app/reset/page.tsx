"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";
import { requestPasswordReset } from "@/app/actions/auth";

async function run(_prev: { sent?: boolean; error?: string }, form: FormData) {
  const r = await requestPasswordReset(form);
  if ("sent" in r) return { sent: true as const };
  return { error: r.error };
}

export default function Reset() {
  const [result, action, pending] = useActionState(run, {} as { sent?: boolean; error?: string });
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm border border-line bg-paper p-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">Wakati</Link>
        <h1 className="mt-4 text-xl font-semibold text-ink">Reset password</h1>
        {result.sent ? (
          <p className="mt-2 text-[13px] text-muted">
            If an account exists for that address, a reset link is on its way. It expires in 1 hour.
          </p>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-muted">Enter your institution email and we'll send a reset link.</p>
            <form action={action} className="mt-6 space-y-4">
              {result.error && <p className="text-[13px] text-red-800">{result.error}</p>}
              <Field label="Email">
                <input name="email" type="email" required placeholder="you@university.edu" className={inputCls} />
              </Field>
              <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <div className="mt-4 text-[13px]">
          <Link href="/login" className="text-indigo-deep hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
