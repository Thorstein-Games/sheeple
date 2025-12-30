"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";

export function Navbar() {
  const { isConnected, playerName, setPlayerName } = useSocket();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname === "/") return "Home";
    if (pathname.includes("/lobby")) return "Lobby";
    if (pathname.includes("/room")) return `Room: ${params.roomId}`;
    return "Sheeple";
  };

  const handleLeaveRoom = () => {
    if (pathname === "/" || pathname === "/lobby") {
      // Clear player data and go home
      setPlayerName(null);
      router.push("/");
    } else if (pathname.startsWith("/room/")) {
      // Leave room and go to lobby
      router.push("/lobby");
    }
  };

  const showLeaveButton = pathname !== "/";

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Page name */}
          <div className="flex items-center flex-1">
            <h1 className="text-xl font-bold text-gray-900">{getPageName()}</h1>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <img src="/sheeple.png" alt="Sheeple" className="h-10 w-auto" />
          </div>

          {/* Right side - Status, Player name, Leave button */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
                title={isConnected ? "Connected" : "Disconnected"}
              />
              <span className="text-sm text-gray-600 hidden sm:inline">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Player Name */}
            {playerName && (
              <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {playerName}
              </div>
            )}

            {/* Leave Button */}
            {showLeaveButton && (
              <button
                onClick={handleLeaveRoom}
                className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
              >
                Leave
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
