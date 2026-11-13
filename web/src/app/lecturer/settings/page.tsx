import { ProfileSettingsLive } from "@/components/profilesettings";

export const instant = false;

export default async function LecturerSettings() {
  return <ProfileSettingsLive role="lecturer" active="/lecturer/settings" path="/lecturer/settings" />;
}
