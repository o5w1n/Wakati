import { NotifCenter } from "@/components/notifcenter";

export default function LecturerNotifications() {
  return (
    <NotifCenter
      role="lecturer" active="/lecturer/notifications" heading="Notifications"
      initial={[
        { id: "1", title: "Timetable updated", body: "Computer Security moved Tue P3–P4 → Wed P2–P3 in v7.", when: "10 Nov 17:40", read: false },
        { id: "2", title: "Availability reminder", body: "Semester 1 window closes Fri 20 Nov. Submit your grid.", when: "8 Nov 09:00", read: false },
        { id: "3", title: "Room change", body: "ML401 practicals moved Lab-B → Lab-A for week 9 only.", when: "2 Nov 14:10", read: true },
      ]}
    />
  );
}
