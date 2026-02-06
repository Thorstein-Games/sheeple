"use client";

import { useState } from "react";
import type { Socket } from "socket.io-client";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/constants";
import { GameEvents } from "@/lib/socket/events";

interface Player {
  playerId: string;
  playerName: string;
  isReady: boolean;
}

interface ReadyRoomProps {
  players: Player[];
  roomId: string;
  isConnected: boolean;
  isReady: boolean;
  readyPlayers: Set<string>;
  previousWinners: Set<string>;
  currentPlayerId: string | undefined;
  hostId: string | undefined;
  socket: Socket | null;
  onPlayerReady: () => void;
  onStartGame: () => void;
}

export default function ReadyRoom({
  players,
  roomId,
  isConnected,
  isReady,
  readyPlayers,
  previousWinners,
  currentPlayerId,
  hostId,
  socket,
  onPlayerReady,
  onStartGame,
}: ReadyRoomProps) {
  const isHost = currentPlayerId === hostId;
  const allPlayersReady =
    players.length >= MIN_PLAYERS &&
    players.every((p) => readyPlayers.has(p.playerId));

  const isDev = process.env.NODE_ENV === "development";
  const [copied, setCopied] = useState(false);

  const handleAddFakePlayer = () => {
    if (socket && isDev) {
      socket.emit(GameEvents.ADD_FAKE_PLAYER, { count: 1 });
    }
  };

  const handleCopyRoomUrl = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-6">Waiting for Players...</h2>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            Players in Room ({players.length}/{MAX_PLAYERS})
          </h3>
          <div className="text-sm">
            {players.length < MIN_PLAYERS ? (
              <span className="text-orange-600 font-medium">
                Need {MIN_PLAYERS - players.length} more to start
              </span>
            ) : players.length >= MAX_PLAYERS ? (
              <span className="text-red-600 font-medium">Room Full</span>
            ) : (
              <span className="text-green-600 font-medium">
                Ready to start!
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          {players.map((player) => (
            <div
              key={player.playerId}
              className={`border-2 rounded-lg p-4 flex justify-between items-center ${
                readyPlayers.has(player.playerId)
                  ? "bg-green-50 border-green-400"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <span className="font-medium flex items-center gap-2">
                {previousWinners.has(player.playerId) && (
                  <span className="text-xl" title="Previous Game Winner">
                    🏆
                  </span>
                )}
                {player.playerId === hostId && (
                  <span className="text-xl" title="Room Host">
                    👑
                  </span>
                )}
                {player.playerName}
              </span>
              <div className="flex items-center gap-2">
                {player.playerId === currentPlayerId && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    You
                  </span>
                )}
                {readyPlayers.has(player.playerId) && (
                  <span className="text-sm bg-green-600 text-white px-2 py-1 rounded">
                    ✓ Ready
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {players.length < MIN_PLAYERS && (
        <div className="flex gap-4 items-center mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex-1">
            You need at least {MIN_PLAYERS} players to start the game. Share the
            room code <span className="font-mono font-bold">{roomId}</span> with
            your friends!
          </p>
          <button
            onClick={handleCopyRoomUrl}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-blue-500 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            {copied ? (
              <span>✓ Copied to Clipboard!</span>
            ) : (
              <span>Copy Room URL</span>
            )}
          </button>
        </div>
      )}

      {isDev && players.length < MAX_PLAYERS && (
        <div className="mb-6 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-800 font-semibold">🔧 Dev Mode</p>
            <button
              onClick={handleAddFakePlayer}
              disabled={!isConnected}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              + Add Fake Player
            </button>
          </div>
        </div>
      )}

      <div className="border-t pt-6">
        {!isReady ? (
          <button
            onClick={onPlayerReady}
            disabled={!isConnected || players.length < MIN_PLAYERS}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Ready
          </button>
        ) : (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <p className="text-green-700 font-semibold">✓ You're Ready!</p>
            <p className="text-green-600 text-sm mt-1">
              {isHost
                ? "Waiting for all players to be ready..."
                : "Waiting for host to start the game..."}
            </p>
          </div>
        )}
        {!isReady && players.length < MIN_PLAYERS && (
          <p className="text-sm text-gray-600 text-center mt-2">
            Ready button will be enabled once {MIN_PLAYERS} players join
          </p>
        )}
        {isHost && allPlayersReady && (
          <button
            onClick={onStartGame}
            disabled={!isConnected}
            className="w-full bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-8"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}
