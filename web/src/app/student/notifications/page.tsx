import { NotifCenter } from "@/components/notifcenter";

export default function StudentNotifications() {
  return (
    <NotifCenter
      role="student" active="/student/notifications" heading="Notifications"
      initial={[
        { id: "1", title: "Timetable updated", body: "Computer Security moved Tue P3–P4 → Wed P2–P3 in v7.", when: "10 Nov 17:40", read: false },
        { id: "2", title: "Room change", body: "ML401 practicals moved Lab-B → Lab-A for week 9 only.", when: "2 Nov 14:10", read: false },
        { id: "3", title: "Semester 1 published", body: "Your personal timetable is ready. Check My Timetable.", when: "10 Nov 17:41", read: true },
      ]}
    />
  );
}
