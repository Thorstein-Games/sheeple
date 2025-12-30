"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameLobby } from "../components/GameLobby";

export default function LobbyPage() {
  const { playerName } = useSocket();
  const router = useRouter();

  useEffect(() => {
    // Redirect back to home if no player name
    if (!playerName) {
      router.push("/");
    }
  }, [playerName, router]);

  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <GameLobby playerName={playerName} />
    </div>
  );
}
