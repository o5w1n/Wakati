import { NotifList } from "@/components/notiflist";

export const instant = false;

export default async function LecturerNotifications() {
  return <NotifList role="lecturer" active="/lecturer/notifications" heading="Notifications" revalidate="/lecturer/notifications" />;
}
