import { ProfileSettings } from "@/components/profilesettings";
import { Field } from "@/components/ui";
import { inputCls } from "@/components/ui";

export default function LecturerSettings() {
  return (
    <ProfileSettings
      role="lecturer" active="/lecturer/settings"
      name="Dr. A. Mensah" email="mensah@acity.edu.gh"
      extra={
        <Field label="Display name on timetables" hint="Shown in the lecturer line of each cell.">
          <input defaultValue="Dr. Mensah" className={inputCls} />
        </Field>
      }
    />
  );
}
