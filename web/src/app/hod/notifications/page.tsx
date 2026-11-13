import { NotifList } from "@/components/notiflist";

export const instant = false;

export default async function HodNotifications() {
  return <NotifList role="hod" active="/hod/notifications" heading="Notifications" revalidate="/hod/notifications" />;
}
