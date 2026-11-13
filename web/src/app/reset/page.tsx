"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";

export default function Reset() {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm border border-line bg-paper p-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">Wakati</Link>
        <h1 className="mt-4 text-xl font-semibold text-ink">Reset password</h1>
        {sent ? (
          <p className="mt-2 text-[13px] text-muted">
            If an account exists for that address, a reset link is on its way. It expires in 1 hour.
          </p>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-muted">Enter your institution email and we'll send a reset link.</p>
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <Field label="Email">
                <input type="email" required placeholder="you@university.edu" className={inputCls} />
              </Field>
              <button type="submit" className={`${btnPrimaryCls} w-full`}>Send reset link</button>
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
