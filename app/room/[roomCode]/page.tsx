import RoomPageClient from "./RoomPageClient";

export async function generateStaticParams() {
  // A shell page so the route exists in the static export. Real room links
  // reach the room through app/not-found.tsx (GitHub Pages serves 404.html
  // for them); the client reads the actual room code from the URL.
  return [{ roomCode: "_" }];
}

export default function RoomPage() {
  return <RoomPageClient />;
}
