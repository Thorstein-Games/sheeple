"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameEvents } from "@/lib/socket/events";
import type { JoinGameData, PlayerJoinedData } from "@/lib/socket/types";

export function GameLobby() {
  const { socket, isConnected } = useSocket();
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerJoinedData[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for player joined events
    socket.on(GameEvents.PLAYER_JOINED, (data: PlayerJoinedData) => {
      console.log("Player joined:", data);
      setPlayers((prev) => [...prev, data]);
      if (!currentRoom) {
        setCurrentRoom(data.roomId);
      }
    });

    // Listen for player left events
    socket.on(GameEvents.PLAYER_LEFT, (data: { playerId: string }) => {
      console.log("Player left:", data);
      setPlayers((prev) => prev.filter((p) => p.playerId !== data.playerId));
    });

    // Listen for errors
    socket.on(GameEvents.ERROR, (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(`Error: ${data.message}`);
    });

    // Cleanup listeners
    return () => {
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.PLAYER_LEFT);
      socket.off(GameEvents.ERROR);
    };
  }, [socket, currentRoom]);

  const handleJoinGame = () => {
    if (!socket || !playerName.trim()) return;

    const data: JoinGameData = {
      playerName: playerName.trim(),
      roomId: roomId.trim() || undefined,
    };

    socket.emit(GameEvents.JOIN_GAME, data);
  };

  const handlePlayerReady = () => {
    if (!socket || !currentRoom) return;
    socket.emit(GameEvents.PLAYER_READY);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Sheeple Game Lobby</h1>

        <div className="mb-4">
          <p className="text-sm">
            Connection Status:
            <span
              className={`ml-2 font-semibold ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </span>
          </p>
        </div>

        {!currentRoom ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

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
              disabled={!isConnected || !playerName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Join Game
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-medium">Room ID:</p>
              <p className="text-2xl font-bold">{currentRoom}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">
                Players ({players.length})
              </h2>
              <ul className="space-y-2">
                {players.map((player) => (
                  <li
                    key={player.playerId}
                    className="bg-white border rounded-lg p-3"
                  >
                    <span className="font-medium">{player.playerName}</span>
                    {player.playerId === socket?.id && (
                      <span className="ml-2 text-sm text-gray-600">(You)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handlePlayerReady}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              I'm Ready!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
