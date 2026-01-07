"use client";

import { useSocket } from "@/lib/socket/SocketProvider";
import { GameLobby } from "../components/GameLobby";
import { BackgroundGrazers } from "../components/BackgroundGrazers";

export default function LobbyPage() {
  const { playerName } = useSocket();

  // playerName is always set by SocketProvider (either from sessionStorage or generated randomly)
  // so we can safely use it without checking

  return (
    <div className="relative min-h-screen py-12">
      <BackgroundGrazers />
      <div className="relative z-10">
        <GameLobby playerName={playerName!} />
      </div>
    </div>
  );
}
