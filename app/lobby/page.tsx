"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameLobby } from "../components/GameLobby";

export default function LobbyPage() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get player name from sessionStorage
    const name = sessionStorage.getItem("playerName");
    if (!name) {
      // Redirect back to home if no player name
      router.push("/");
      return;
    }
    setPlayerName(name);
  }, [router]);

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
