"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/brand";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";
import { registerUniversity } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

const initial = { error: "" } as { error?: string };
const STEPS = ["Institution", "Admin", "Confirm"];

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
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [domain, setDomain] = useState("");
  const [adminName, setAdminName] = useState("");
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await registerUniversity(form)) ?? initial,
    initial
  );

  const titles = ["Tell us about your institution", "Who will run Wakati for this institution?", "Check the details"];
  const subs = [
    "Step 1 of 3 — Institution.",
    "This person becomes the institution’s first administrator. You can add more later.",
    "Summary of the institution and administrator before you create it.",
  ];

  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-xl px-6 pb-20">
        <Stepper step={step} />
        <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-heading">{titles[step - 1]}</h1>
        <p className="mt-1.5 text-center text-sm text-body">{subs[step - 1]}</p>

        <form action={action} className="mt-6">
          {/* hidden fields carry step-1/2 values through on final submit */}
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="short_code" value={shortCode} />
          <input type="hidden" name="domain" value={domain} />
          <input type="hidden" name="admin_name" value={adminName} />

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Institution Name">
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Academic City University" className={inputCls} />
              </Field>
              <Field label="Short code" hint="Used in links and reports. Letters and numbers only.">
                <input value={shortCode} onChange={(e) => setShortCode(e.target.value)} required placeholder="ACity" className={inputCls} maxLength={8} />
              </Field>
              <Field label="Domain (optional)" hint="Lets staff and students with this email domain find your institution.">
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
                <input type="email" required placeholder="you@acity.edu.gh" className={inputCls} />
              </Field>
              <Field label="Job title">
                <input placeholder="Timetable officer" className={inputCls} />
              </Field>
              <p className="rounded-xl border border-cardline bg-card p-4 text-[13px] leading-relaxed text-body">
                You’ll sign in with your existing Wakati account. If you don’t have one yet,{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">create it first</Link>{" "}
                — then come back here to register <strong className="text-heading">{name || "your institution"}</strong>.
              </p>
            </div>
          )}

          {step === 3 && (
            <dl className="space-y-0 overflow-hidden rounded-xl border border-cardline bg-card text-[13px]">
              {[
                ["Institution", name || "–"],
                ["Short code", shortCode || "–"],
                ["Domain", domain || "–"],
                ["Administrator", adminName || "–"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-cardline px-4 py-3 last:border-0">
                  <dt className="text-body">{k}</dt>
                  <dd className="font-semibold text-heading">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {state?.error ? <p className="mt-4 text-[13px] text-bad-text">{state.error}</p> : null}

          <div className="mt-6 flex items-center justify-between">
            {step === 1 ? (
              <Link href="/get-started" className="text-sm text-body transition-colors hover:text-heading">
                Cancel
              </Link>
            ) : (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 text-sm text-body transition-colors hover:text-heading">
                <ArrowLeft size={15} aria-hidden /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 && (!name.trim() || !shortCode.trim())}
                onClick={() => setStep(step + 1)}
                className={btnPrimaryCls}
              >
                Next <ArrowRight size={15} aria-hidden />
              </button>
            ) : (
              <button type="submit" disabled={pending || !adminName.trim()} className={btnPrimaryCls}>
                {pending ? "Creating…" : <>Create institution<ArrowRight size={15} aria-hidden /></>}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
