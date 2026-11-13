import { Shell } from "@/components/shell";
import { RoomViews } from "@/components/rooms";

export default function StudentRooms() {
  return (
    <Shell role="student" active="/student/rooms">
      <RoomViews role="student" heading="Room Views" sub="Published v7 · find where your class meets, or an empty room to study." />
    </Shell>
  );
}
