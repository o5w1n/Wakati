import { Shell } from "@/components/shell";
import { PageHeader, Field, StatusBadge } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";

export default function PlatformSettings() {
  return (
    <Shell role="superadmin" active="/admin/settings">
      <PageHeader title="Platform Settings" sub="Defaults for new institutions. Tenants can override their own grid and rules." />
      <div className="grid max-w-2xl gap-3">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-ink">
            Registration <StatusBadge tone="neutral">manual for now</StatusBadge>
          </div>
          <div className="space-y-3">
            <Field label="New institutions start as" hint="Pending requires your approval; Active skips it.">
              <select className={inputCls} defaultValue="pending">
                <option value="pending">Pending — approve each one</option>
                <option value="active">Active immediately</option>
              </select>
            </Field>
            <Field label="Invite expiry" hint="Matches the 14-day default in the invites table.">
              <select className={inputCls} defaultValue="14">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </Field>
          </div>
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-ink">
            Solver defaults <StatusBadge tone="neutral">manual for now</StatusBadge>
          </div>
          <div className="space-y-3">
            <Field label="Max solve time per job (seconds)">
              <input type="number" defaultValue={300} className={inputCls} />
            </Field>
            <Field label="Quality gate" hint="Below this score the editor warns before publish.">
              <input type="number" defaultValue={85} className={inputCls} />
            </Field>
          </div>
        </section>
        <div>
          <button className={btnPrimaryCls}>Save platform settings</button>
          <p className="mt-2 text-xs text-muted">Persisted platform config (service-role settings table) is still to come — values above are not saved yet.</p>
        </div>
      </div>
    </Shell>
  );
}
