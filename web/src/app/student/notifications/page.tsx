import { NotifList } from "@/components/notiflist";

export const instant = false;

export default async function StudentNotifications() {
  return <NotifList role="student" active="/student/notifications" heading="Notifications" revalidate="/student/notifications" />;
}
