import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { savePlatformSettings } from "./actions";

export const instant = false;

export default async function PlatformSettings() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="superadmin" active="/admin/settings">
        <PageHeader title="Platform Settings" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: row } = await sb.from("platform_settings").select("*").eq("id", "platform").single();
  const s = (row ?? {}) as {
    new_institution_status?: string; invite_expiry_days?: number;
    solver_time_limit?: number; quality_gate?: number;
  };

  return (
    <Shell role="superadmin" active="/admin/settings">
      <PageHeader title="Platform Settings" sub="Defaults for new institutions. Tenants can override their own grid and rules." />
      <form action={savePlatformSettings} className="grid max-w-2xl gap-3">
        <section className="rounded-xl border border-cardline bg-card p-4">
          <h2 className="mb-4 text-sm font-medium text-heading">Registration</h2>
          <div className="space-y-3">
            <Field label="New institutions start as" hint="Pending requires your approval; Active skips it.">
              <select name="new_institution_status" className={inputCls} defaultValue={s.new_institution_status ?? "pending"}>
                <option value="pending">Pending — approve each one</option>
                <option value="active">Active immediately</option>
              </select>
            </Field>
            <Field label="Invite expiry" hint="New invites expire after this long.">
              <select name="invite_expiry_days" className={inputCls} defaultValue={String(s.invite_expiry_days ?? 14)}>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </Field>
          </div>
        </section>
        <section className="rounded-xl border border-cardline bg-card p-4">
          <h2 className="mb-4 text-sm font-medium text-heading">Solver defaults</h2>
          <div className="space-y-3">
            <Field label="Max solve time per job (seconds)">
              <input name="solver_time_limit" type="number" min={10} defaultValue={s.solver_time_limit ?? 300} className={inputCls} />
            </Field>
            <Field label="Quality gate" hint="Below this score the editor warns before publish.">
              <input name="quality_gate" type="number" min={0} max={100} defaultValue={s.quality_gate ?? 85} className={inputCls} />
            </Field>
          </div>
        </section>
        <div>
          <button type="submit" className={btnPrimaryCls}>Save platform settings</button>
        </div>
      </form>
    </Shell>
  );
}
