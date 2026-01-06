"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/lib/socket/SocketProvider";

export function Navbar() {
  const { isConnected, playerName, setPlayerName } = useSocket();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/how-to-play") return "How to Play";
    if (pathname === "/contact") return "Contact";
    if (pathname.includes("/lobby")) return "Lobby";
    if (pathname.includes("/room")) return `Room: ${params.roomId}`;
    return "Sheeple";
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
                <img src="/arrow-left.svg" alt="Back" className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">{getPageName()}</h1>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" aria-label="Home">
              <img
                src="/sheeple.png"
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
