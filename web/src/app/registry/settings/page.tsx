import { Shell } from "@/components/shell";
import { PageHeader, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";

export default function RegistrySettings() {
  return (
    <Shell role="registry" active="/registry/settings">
      <PageHeader title="Settings" sub="Academic City University · Semester 1 2026/27. The time grid is yours — not fixed Mon–Fri." />
      <div className="grid max-w-2xl gap-3">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Time grid</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Teaching days">
              <select className={inputCls} defaultValue="mon-fri">
                <option value="mon-fri">Mon – Fri</option>
                <option value="mon-sat">Mon – Sat</option>
                <option value="mon-thu">Mon – Thu</option>
              </select>
            </Field>
            <Field label="Periods per day">
              <input type="number" defaultValue={9} min={1} max={24} className={inputCls} />
            </Field>
            <Field label="First period starts">
              <input type="time" defaultValue="08:00" className={inputCls} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">Changing the grid re-seeds periods for this semester only. Published versions keep their own grid.</p>
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Solver rules</div>
          <div className="space-y-2 text-[13px]">
            {[
              ["H1–H12", "Hard constraints", "always on — violations block publish"],
              ["P1 ±15", "Preferred windows", "lecturer preference weight"],
              ["P5 ≤ 6", "Max periods per day", "per lecturer"],
              ["P6 ≤ 3", "Max consecutive", "before a forced break"],
            ].map(([code, name, note]) => (
              <div key={code} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                <span><span className="font-mono text-xs text-muted">{code}</span> <span className="ml-1 font-medium text-ink">{name}</span></span>
                <span className="text-muted">{note}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Semester</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status">
              <select className={inputCls} defaultValue="review">
                <option value="setup">Setup</option>
                <option value="availability">Availability</option>
                <option value="solving">Solving</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
            <Field label="Blocked slots note">
              <input defaultValue="Wed P5 — assembly (all rooms)" className={inputCls} />
            </Field>
          </div>
        </section>
        <div><button className={btnPrimaryCls}>Save settings</button></div>
      </div>
    </Shell>
  );
}
