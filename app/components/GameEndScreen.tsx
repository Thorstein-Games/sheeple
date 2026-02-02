"use client";

import type { Socket } from "socket.io-client";
import { GameEvents } from "@/lib/socket/events";
import type { GameEndData } from "@/lib/socket/types";

interface GameEndScreenProps {
  gameEndData: GameEndData;
  currentPlayerId: string | undefined;
  socket: Socket | null;
  onPlayAgain: () => void;
}

export default function GameEndScreen({
  gameEndData,
  currentPlayerId,
  socket,
  onPlayAgain,
}: GameEndScreenProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🎉 Game Over! 🎉</h1>
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Winner: {gameEndData.winner?.playerName || "Unknown"}
          </h2>
          <p className="text-2xl text-white font-semibold">
            {gameEndData.winner?.score || 0} points
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
        {gameEndData.players.map((player, index) => (
          <div
            key={player?.playerId || index}
            className={`flex justify-between items-center p-4 rounded-lg ${
              index === 0
                ? "bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400"
                : index === 1
                  ? "bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400"
                  : index === 2
                    ? "bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400"
                    : "bg-gray-50 border-2 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-600">
                #{index + 1}
              </span>
              <span className="font-semibold text-lg">
                {player?.playerName || "Unknown Player"}
                {player?.playerId === currentPlayerId && (
                  <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded">
                    You
                  </span>
                )}
              </span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {player?.score || 0} pts
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          if (socket) {
            socket.emit(GameEvents.PLAYER_READY);
            onPlayAgain();
          }
        }}
        className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
