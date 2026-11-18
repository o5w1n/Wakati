"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/brand";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";
import { cn } from "@/lib/cn";

const STEPS = ["Institution", "Admin account", "Confirm"];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-center" aria-label="Progress">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const on = n === step;
        const done = n < step;
        return (
          <li key={s} className="flex items-center">
            {i > 0 && <span className={cn("mx-3 h-px w-12", n <= step ? "bg-primary" : "bg-cardline")} aria-hidden />}
            <span className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold",
                  on || done ? "bg-primary text-white" : "border border-cardline bg-card text-body"
                )}
                aria-current={on ? "step" : undefined}
              >
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </span>
              <span className={cn("text-xs", on ? "font-semibold text-heading" : "text-muted")}>{s}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function CreateInstitution() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [domain, setDomain] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setPending(true);
    try {
      const sb = supabaseBrowser();
      const { data, error: signErr } = await sb.auth.signUp({
        email: adminEmail.trim(),
        password,
        options: { data: { full_name: adminName.trim() } },
      });
      if (signErr) throw signErr;
      if (!data.session) {
        // email confirmation required - try sign in won't work; instruct user
        throw new Error("Account created but no session returned. If email confirmation is enabled, confirm your email then sign in and create the institution from Get Started.");
      }
      const { error: rpcErr } = await sb.rpc("register_university", {
        p_name: name.trim(),
        p_short_code: shortCode.trim(),
        p_domain: domain.trim() || null,
        p_admin_full_name: adminName.trim() || null,
      });
      if (rpcErr) throw rpcErr;
      // refresh session so JWT picks up new claims if hook runs on refresh
      await sb.auth.refreshSession();
      router.push("/registry");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to create institution.");
    } finally {
      setPending(false);
    }
  }

  const titles = ["Tell us about your institution", "Create your admin account", "Check the details"];
  const subs = [
    "Step 1 of 3 — Institution details and institution code.",
    "You’ll sign in with this email and password. This account becomes the timetable admin.",
    "Confirm before creating the institution.",
  ];

  const canNext1 = name.trim() && shortCode.trim();
  const canNext2 = adminName.trim() && adminEmail.trim() && password.length >= 6;

  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-xl px-6 pb-20">
        <Stepper step={step} />
        <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-heading">{titles[step - 1]}</h1>
        <p className="mt-1.5 text-center text-sm text-body">{subs[step - 1]}</p>

        <div className="mt-6 rounded-xl border border-cardline bg-card p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Institution Name">
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Academic City University" className={inputCls} />
              </Field>
              <Field label="Institution code (short code)" hint="This is the code students, HODs, and lecturers will use to join. Letters/numbers only.">
                <input value={shortCode} onChange={(e) => setShortCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} required placeholder="ACITY" className={inputCls} maxLength={12} />
              </Field>
              <Field label="Email domain (optional)" hint="If set, members must sign up with this email domain.">
                <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acity.edu.gh" className={inputCls} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Full name">
                <input value={adminName} onChange={(e) => setAdminName(e.target.value)} required placeholder="Registry Admin" className={inputCls} />
              </Field>
              <Field label="Work email">
                <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder="you@acity.edu.gh" className={inputCls} />
              </Field>
              <Field label="Password" hint="At least 6 characters. You’ll use this to sign in regularly.">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading" aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <p className="text-[13px] text-body">After creating the institution you can generate access codes for HODs, lecturers, and students from the Registry.</p>
            </div>
          )}

          {step === 3 && (
            <dl className="space-y-0 overflow-hidden rounded-xl border border-cardline bg-card text-[13px]">
              {[
                ["Institution", name || "–"],
                ["Institution code", shortCode || "–"],
                ["Domain", domain || "–"],
                ["Admin name", adminName || "–"],
                ["Admin email", adminEmail || "–"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-cardline px-4 py-3 last:border-0">
                  <dt className="text-body">{k}</dt>
                  <dd className="font-semibold text-heading">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {error ? <p className="mt-4 text-[13px] text-bad-text">{error}</p> : null}

          <div className="mt-6 flex items-center justify-between">
            {step === 1 ? (
              <Link href="/get-started" className="text-sm text-body transition-colors hover:text-heading">Cancel</Link>
            ) : (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 text-sm text-body transition-colors hover:text-heading">
                <ArrowLeft size={15} aria-hidden /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
                onClick={() => setStep(step + 1)}
                className={btnPrimaryCls}
              >
                Next <ArrowRight size={15} aria-hidden />
              </button>
            ) : (
              <button type="button" disabled={pending} onClick={submit} className={btnPrimaryCls}>
                {pending ? "Creating…" : <>Create institution <ArrowRight size={15} aria-hidden /></>}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
