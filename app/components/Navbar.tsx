"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { useColyseus, getCurrentRoomCode } from "@/lib/colyseus/ColyseusProvider";
import { asset, roomUrl } from "@/lib/basePath";

const noSubscription = () => () => {};

export function Navbar() {
  const { isConnected, playerName, setPlayerName } = useColyseus();
  const router = useRouter();
  const params = useParams();
  const routerPathname = usePathname();
  // Room links are served by the 404 page (GitHub Pages has no rewrites),
  // which is prerendered without knowing the URL. Render room paths as a
  // plain page until hydrated so the markup matches, then show the room bar.
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const pathname = hydrated || !routerPathname.startsWith("/room") ? routerPathname : "/_room";
  // useParams() returns "_" (pre-rendered shell) in static export. Use
  // window.location to get the actual room code after hydration.
  const [navRoomCode, setNavRoomCode] = useState("_");
  useEffect(() => {
    setNavRoomCode(getCurrentRoomCode());
  }, [pathname]);
  const [showRoomPopover, setShowRoomPopover] = useState(false);
  const [roomCopied, setRoomCopied] = useState(false);

  const getPageName = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/how-to-play") return "How to Play";
    if (pathname === "/contact") return "Contact";
    if (pathname.includes("/lobby")) return "Lobby";
    if (pathname.includes("/room")) return null; // Handle room separately
    return "Sheeple";
  };

  const handleCopyRoomCode = async () => {
    if (!navRoomCode || navRoomCode === "_") return;

    const shareUrl = roomUrl(navRoomCode);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setRoomCopied(true);
      setTimeout(() => {
        setRoomCopied(false);
        setShowRoomPopover(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy room URL:", err);
    }
  };

  const handleLeaveRoom = () => {
    if (pathname.startsWith("/room/")) {
      // Leave room and go to lobby
      router.push("/lobby");
    } else {
      // Clear player data and go home
      setPlayerName(null);
      router.push("/");
    }
  };

  const showLeaveButton = pathname !== "/";

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back arrow and Page name */}
          <div className="flex items-center gap-3 flex-1">
            {showLeaveButton && (
              <button
                onClick={handleLeaveRoom}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <img src={asset("/arrow-left.svg")} alt="Back" className="h-5 w-5" />
              </button>
            )}
            {pathname.includes("/room") ? (
              <div className="relative">
                <div
                  className="text-xl font-bold text-gray-900 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onMouseEnter={() => setShowRoomPopover(true)}
                  onMouseLeave={() => {
                    if (!roomCopied) setShowRoomPopover(false);
                  }}
                  onClick={handleCopyRoomCode}
                  onKeyDown={handleCopyRoomCode}
                  role="button"
                  tabIndex={0}
                >
                  <span>Room:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-base">
                    {navRoomCode}
                  </span>
                </div>
                {showRoomPopover && (
                  <div
                    className="absolute left-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-50"
                    onMouseEnter={() => setShowRoomPopover(true)}
                    onMouseLeave={() => setShowRoomPopover(false)}
                  >
                    {roomCopied ? (
                      <span>✓ Copied!</span>
                    ) : (
                      <span>Click to Copy Room URL</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-900">
                {getPageName()}
              </div>
            )}
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" aria-label="Home">
              <img
                src={asset("/sheeple.png")}
                alt="Sheeple"
                className="h-10 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Right side - Player name with connection status */}
          <div className="flex items-center flex-1 justify-end">
            {/* Player Name with Connection Status */}
            {playerName && (
              <div className="flex items-center gap-2 group relative">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={isConnected ? "Connected" : "Disconnected"}
                  tabIndex={0}
                  aria-label={isConnected ? "Connected" : "Disconnected"}
                />
                <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  {playerName}
                </div>
                {/* Tooltip on hover for both mobile and desktop */}
                <span className="absolute left-0 top-8 z-10 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
