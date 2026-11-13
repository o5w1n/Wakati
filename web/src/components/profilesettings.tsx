import { Shell } from "@/components/shell";
import { PageHeader, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";

export function ProfileSettings({ role, active, name, email, extra }: {
  role: "lecturer" | "student" | "hod";
  active: string;
  name: string;
  email: string;
  extra?: React.ReactNode;
}) {
  return (
    <Shell role={role} active={active}>
      <PageHeader title="Settings" sub={email} />
      <div className="grid max-w-2xl gap-3">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Profile</div>
          <div className="space-y-3">
            <Field label="Full name"><input defaultValue={name} className={inputCls} /></Field>
            <Field label="Email" hint="Managed by your institution — contact Registry to change it.">
              <input defaultValue={email} disabled className={`${inputCls} opacity-60`} />
            </Field>
            {extra}
          </div>
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Change password</div>
          <div className="space-y-3">
            <Field label="Current password"><input type="password" className={inputCls} /></Field>
            <Field label="New password"><input type="password" className={inputCls} /></Field>
            <button className={btnPrimaryCls}>Update password</button>
          </div>
        </section>
      </div>
    </Shell>
  );
}
