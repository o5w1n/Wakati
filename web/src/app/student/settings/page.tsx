import { ProfileSettings } from "@/components/profilesettings";
import { Field } from "@/components/ui";
import { inputCls } from "@/components/ui";

export default function StudentSettings() {
  return (
    <ProfileSettings
      role="student" active="/student/settings"
      name="Kofi Asante" email="kofi.a@acity.edu.gh"
      extra={
        <Field label="Electives" hint="Changing electives rebuilds the overlap map — confirm with Registry.">
          <input defaultValue="ML401, CRY402" className={inputCls} />
        </Field>
      }
    />
  );
}
