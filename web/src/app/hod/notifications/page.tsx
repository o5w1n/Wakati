import { NotifCenter } from "@/components/notifcenter";

export default function HodNotifications() {
  return (
    <NotifCenter
      role="hod" active="/hod/notifications" heading="Notifications"
      initial={[
        { id: "1", title: "v8 draft ready for comment", body: "Registry submitted v8 — review your department's sessions before publish.", when: "13 Nov 09:12", read: false },
        { id: "2", title: "Availability gaps", body: "3 of your 5 lecturers haven't submitted. Deadline Fri 20 Nov.", when: "12 Nov 08:00", read: false },
        { id: "3", title: "v7 published", body: "Semester 1 v7 is live for students and lecturers.", when: "10 Nov 17:40", read: true },
      ]}
    />
  );
}
