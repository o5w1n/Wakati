"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { Field, inputCls, btnPrimaryCls } from "@/components/ui";
import { requestJoin } from "@/app/actions/auth";
import { supabaseBrowser } from "@/lib/supabase-client";

const initial = { error: "" } as { error?: string };

interface Uni {
  id: string;
  name: string;
  short_code: string;
}

export default function RequestJoin() {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => (await requestJoin(form)) ?? initial,
    initial
  );
  const [unis, setUnis] = useState<Uni[]>([]);
  useEffect(() => {
    supabaseBrowser()
      .from("universities")
      .select("id,name,short_code")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setUnis((data as Uni[]) ?? []));
  }, []);
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-md px-6 pb-16">
        <h1 className="text-center text-[28px] font-bold tracking-tight text-heading">Find / Join Institution</h1>
        <p className="mt-1.5 text-center text-sm text-body">Request to join an existing institution. Your admin approves requests — no open self-join.</p>
        <form action={action} className="mt-6 space-y-4 rounded-xl border border-cardline bg-card p-6">
          <Field label="Institution">
            <select name="university_id" className={inputCls} required defaultValue="">
              <option value="" disabled>Choose your institution…</option>
              {unis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.short_code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="I am a…">
            <select name="role" className={inputCls} defaultValue="student">
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="hod">Head of department</option>
            </select>
          </Field>
          <Field label="Full name">
            <input name="full_name" required placeholder="Ama Serwaa" className={inputCls} />
          </Field>
          {state?.error ? <p className="text-[13px] text-bad-text">{state.error}</p> : null}
          <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
            {pending ? "Sending…" : "Send request"}
          </button>
          <p className="text-center">
            <Link href="/get-started" className="text-[13px] text-body hover:text-heading">← Back</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
