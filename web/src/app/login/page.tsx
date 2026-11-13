"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/brand";
import { inputWithIconCls, btnPrimaryCls } from "@/components/ui";
import { signIn } from "@/app/actions/auth";

const initial = { error: "" } as { error?: string };

export default function Login() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => {
      const r = (await signIn(form)) ?? initial;
      if (r.error && /invalid login credentials/i.test(r.error)) {
        return { error: "That email and password do not match. Try again, or reset your password." };
      }
      return r;
    },
    initial
  );
  const [show, setShow] = useState(false);
  return (
    <div className="grid min-h-screen bg-page md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-[28px] font-bold tracking-tight text-heading">Welcome back</h1>
          <p className="mt-1.5 text-sm text-body">Sign in to see your timetable.</p>
          <form action={action} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-heading">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input id="email" name="email" type="email" required placeholder="you@acity.edu.gh" className={inputWithIconCls} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-heading">
                Password
              </label>
              <div className="relative">
                <Lock size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className={`${inputWithIconCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-heading"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
            <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full !h-11`}>
              {pending ? "Signing in…" : "Sign In"}
            </button>
            <p className="text-center">
              <Link href="/reset" className="text-[13px] font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
        </div>
      </div>
      {/* right: campus photo full height */}
      <div className="relative hidden overflow-hidden bg-sidebar md:block" aria-hidden>
        <svg viewBox="0 0 400 600" className="absolute inset-0 h-full w-full text-white/25" fill="currentColor">
          <rect x="110" y="60" width="190" height="540" rx="4" />
          <rect x="20" y="180" width="90" height="420" rx="4" opacity="0.7" />
          <rect x="300" y="180" width="90" height="420" rx="4" opacity="0.7" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar/50 via-transparent to-transparent" />
      </div>
    </div>
  );
}
