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
    <div className="grid min-h-dvh bg-page md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-[28px] font-bold tracking-tight text-heading">Welcome back</h1>
          <p className="mt-1.5 text-sm text-body">Sign in with your email and password to view your timetable.</p>
          <form action={action} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-heading">Email address</label>
              <div className="relative">
                <Mail size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input id="email" name="email" type="email" required placeholder="you@acity.edu.gh" className={inputWithIconCls} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-heading">Password</label>
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
            <div className="flex items-center justify-between text-[13px]">
              <Link href="/reset" className="font-medium text-primary hover:underline">Forgot password?</Link>
              <Link href="/get-started" className="text-body hover:text-heading">Create/join account</Link>
            </div>
          </form>
          <div className="mt-6 rounded-xl border border-cardline bg-card p-4 text-[13px] text-body">
            <div className="font-semibold text-heading">Joining for the first time?</div>
            <p className="mt-1">Use your <span className="font-medium">institution code</span> and your <span className="font-medium">student/lecturer/HOD access code</span> to create an account, then sign in regularly here.</p>
            <Link href="/join" className="mt-2 inline-block font-medium text-primary hover:underline">Join with access code →</Link>
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-sidebar via-[#1a2440] to-primary/80 md:block" aria-hidden>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 20% 20%, #fff 0, transparent 25%), radial-gradient(circle at 80% 30%, #fff 0, transparent 20%), radial-gradient(circle at 40% 80%, #fff 0, transparent 30%)"}} />
        <div className="absolute inset-x-10 bottom-12 rounded-2xl border border-white/15 bg-white/10 p-6 text-white backdrop-blur-sm">
          <div className="text-lg font-bold">Wakati Timetabling</div>
          <p className="mt-1 text-sm text-white/80">View your timetable by course, level, cohort, or location. Search what class is happening where and when.</p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/85">
            <li>• Registry: generate timetables & access codes</li>
            <li>• HOD/Lecturers: department and teaching views</li>
            <li>• Students: level, course, cohort & room views</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
