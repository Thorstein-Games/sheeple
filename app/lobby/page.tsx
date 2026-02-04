"use client";

import { useSocket } from "@/lib/socket/SocketProvider";
import { GameLobby } from "../components/GameLobby";
import { BackgroundGrazers } from "../components/BackgroundGrazers";
import Chat from "../components/Chat";

export default function LobbyPage() {
  const { playerName } = useSocket();

  // playerName is always set by SocketProvider (either from localStorage or generated randomly)
  // so we can safely use it without checking

  return (
    <div className="relative min-h-screen py-12">
      <BackgroundGrazers />
      <div className="relative z-10">
        <GameLobby playerName={playerName!} />
      </div>

      {/* Chat Component for lobby */}
      <Chat roomId="lobby" />
    </div>
  );
}
