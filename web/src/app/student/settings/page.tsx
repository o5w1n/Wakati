import { ProfileSettingsLive } from "@/components/profilesettings";

export const instant = false;

export default async function StudentSettings() {
  return <ProfileSettingsLive role="student" active="/student/settings" path="/student/settings" />;
}
