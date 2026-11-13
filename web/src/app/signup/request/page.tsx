"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md border border-line bg-paper p-8">
        <Link href="/signup" className="text-[13px] text-muted hover:text-ink">← Back</Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Request to join</h1>
        <p className="mt-1 text-[13px] text-muted">Your admin approves requests. No open self-join.</p>
        <form action={action} className="mt-6 space-y-4">
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
        </form>
      </div>
    </div>
  );
}
