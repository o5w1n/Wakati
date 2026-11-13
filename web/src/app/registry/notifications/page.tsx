import { NotifList } from "@/components/notiflist";

export const instant = false;

export default async function RegistryNotifications() {
  return <NotifList role="registry" active="/registry/notifications" heading="Notifications" revalidate="/registry/notifications" />;
}
