import RoomPageClient from "./RoomPageClient";

export async function generateStaticParams() {
  // Generate a shell page used as a static fallback for all room codes.
  // Netlify rewrites /room/* to this shell; Next.js client router reads
  // the actual room code from the URL after hydration.
  return [{ roomCode: "_" }];
}

export default function RoomPage() {
  return <RoomPageClient />;
}
