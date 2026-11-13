import { RoomViewsLive } from "@/components/roomviews";

export const instant = false;

export default async function StudentRooms() {
  return <RoomViewsLive role="student" active="/student/rooms" heading="Room Views" />;
}
