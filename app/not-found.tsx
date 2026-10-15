"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { appPathname } from "@/lib/basePath";
import RoomPageClient from "./room/[roomCode]/RoomPageClient";
import SpectatePageClient from "./room/[roomCode]/spectate/SpectatePageClient";

type View = "pending" | "room" | "spectate" | "missing";

function viewForPath(): View {
  const path = appPathname().replace(/\/+$/, "");
  if (/^\/room\/[^/]+\/spectate$/.test(path)) return "spectate";
  if (/^\/room\/[^/]+$/.test(path)) return "room";
  return "missing";
}

const noSubscription = () => () => {};

/**
 * GitHub Pages serves this page (404.html) for every path it has no file for,
 * including room links like /sheeple/room/ABCD. Those are real pages: render
 * the room (the room components read the code from the URL).
 */
export default function NotFound() {
  // "pending" while prerendering (no URL yet), then decided from the address bar.
  const view = useSyncExternalStore<View>(noSubscription, viewForPath, () => "pending");

  if (view === "room") return <RoomPageClient />;
  if (view === "spectate") return <SpectatePageClient />;
  if (view === "pending") return null;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-3xl font-bold text-gray-800">Page not found</h1>
      <p className="text-gray-600">This page wandered off from the herd.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Back to Sheeple
      </Link>
    </div>
  );
}
