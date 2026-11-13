import { RoomViewsLive } from "@/components/roomviews";

export const instant = false;

export default async function LecturerRooms() {
  return <RoomViewsLive role="lecturer" active="/lecturer/rooms" heading="Room Views" />;
}
