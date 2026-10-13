"use client";

import { GameLobby } from "../components/GameLobby";
import { useColyseus } from "@/lib/colyseus/ColyseusProvider";
import { BackgroundGrazers } from "../components/BackgroundGrazers";

export default function LobbyPage() {
  const { playerName } = useColyseus();

  return (
    <div className="relative min-h-screen py-12">
      <BackgroundGrazers />
      <div className="relative z-10">
        <GameLobby playerName={playerName!} />
      </div>
    </div>
  );
}
