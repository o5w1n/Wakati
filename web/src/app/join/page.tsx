"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/brand";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function JoinInstitution() {
  const router = useRouter();
  const [institutionCode, setInstitutionCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const sb = supabaseBrowser();
      const { data, error: signErr } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (signErr) throw signErr;

      if (!data.session) {
        try {
          sessionStorage.setItem("wakati_pending_join", JSON.stringify({
            institutionCode: institutionCode.trim(),
            accessCode: accessCode.trim(),
            fullName: fullName.trim(),
          }));
        } catch {}
        router.push("/signup/pending?confirm=1");
        return;
      }

      const { data: redeemed, error: rpcErr } = await sb.rpc("redeem_access_code", {
        p_institution_code: institutionCode.trim(),
        p_access_code: accessCode.trim(),
        p_full_name: fullName.trim() || null,
      });
      if (rpcErr) throw rpcErr;

      await sb.auth.refreshSession();
      const role = (redeemed as any)?.role as string | undefined;
      const home: Record<string, string> = {
        super_admin: "/admin",
        timetable_admin: "/registry",
        hod: "/hod",
        lecturer: "/lecturer",
        student: "/student",
      };
      router.push(home[role || ""] || "/post-login");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Could not join institution.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-md px-6 pb-16">
        <h1 className="text-center text-[28px] font-bold tracking-tight text-heading">Join your institution</h1>
        <p className="mt-1.5 text-center text-sm text-body">
          Create your account with your institution code and the access code given to you (student, lecturer, or HOD). After this you can sign in regularly with your email and password.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-cardline bg-card p-6 shadow-sm">
          <Field label="Institution code" hint="Provided by your institution (e.g. ACITY).">
            <input value={institutionCode} onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())} required placeholder="ACITY" className={inputCls} />
          </Field>
          <Field label="Access code" hint="Your student, lecturer, or HOD access code from the Registry.">
            <input value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} required placeholder="e.g. STUD-AB12CD" className={`${inputCls} font-mono`} />
          </Field>
          <div className="border-t border-cardline pt-2" />
          <Field label="Full name">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ama Serwaa" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@acity.edu.gh" className={inputCls} />
          </Field>
          <Field label="Password" hint="At least 6 characters. Use this to sign in regularly.">
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
          {error ? <p className="text-[13px] text-bad-text">{error}</p> : null}
          <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
            {pending ? "Creating account…" : "Create account & join"}
          </button>
          <p className="text-center text-[13px] text-body">
            Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
          <p className="text-center">
            <Link href="/get-started" className="text-[13px] text-body hover:text-heading">← Back</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
