import { Shell } from "@/components/shell";
import { RoomViews } from "@/components/rooms";

export default function LecturerRooms() {
  return (
    <Shell role="lecturer" active="/lecturer/rooms">
      <RoomViews role="lecturer" heading="Room Views" sub="Published v7 · where every room is, and where it's free." />
    </Shell>
  );
}
