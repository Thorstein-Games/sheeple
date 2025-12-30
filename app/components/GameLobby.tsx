"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameEvents } from "@/lib/socket/events";
import type { JoinGameData, PlayerJoinedData } from "@/lib/socket/types";

interface GameLobbyProps {
  playerName: string;
}

export function GameLobby({ playerName }: GameLobbyProps) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on(GameEvents.PLAYER_JOINED, (data: PlayerJoinedData) => {
      router.push(`/room/${data.roomId}`);
    });

    socket.on(GameEvents.ROOM_STATE, (data: { roomId: string }) => {
      router.push(`/room/${data.roomId}`);
    });

    socket.on(GameEvents.ERROR, (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(`Error: ${data.message}`);
    });

    return () => {
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.ROOM_STATE);
      socket.off(GameEvents.ERROR);
    };
  }, [socket, router]);

  const handleJoinGame = () => {
    if (!socket) return;

    const data: JoinGameData = {
      playerName: playerName,
      roomId: roomId.trim() || undefined,
    };

    socket.emit(GameEvents.JOIN_GAME, data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold">Sheeple Game Lobby</h1>
          <p className="text-xl font-bold text-blue-600">{playerName}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Room ID (optional)
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Leave blank to create new room"
            />
          </div>

          <button
            onClick={handleJoinGame}
            disabled={!isConnected}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold cursor-pointer hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {roomId ? `Join Game` : "Create Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
