"use client";

import type { Room } from "colyseus.js";
import SheepExplosion from "./SheepExplosion";

interface GameEndData {
  results: Array<{
    rank: number;
    playerName: string;
    score: number;
  }>;
  winner: string | null;
}

interface GameEndScreenProps {
  gameEndData: GameEndData;
  currentPlayerId: string | undefined;
  hostId: string | undefined;
  room: Room | null;
  onPlayAgain: () => void;
}

export default function GameEndScreen({
  gameEndData,
  currentPlayerId,
  hostId,
  room,
  onPlayAgain,
}: GameEndScreenProps) {
  const isHost = currentPlayerId === hostId;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🎉 Game Over! 🎉</h1>
        <div className="bg-linear-to-r from-yellow-400 to-orange-400 rounded-xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Winner: {gameEndData.winner || "Unknown"}
          </h2>
          <p className="text-2xl text-white font-semibold">
            {gameEndData.results[0]?.score || 0} points
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
        {gameEndData.results.map((player, index) => (
          <div
            key={index}
            className={`flex justify-between items-center p-4 rounded-lg relative overflow-visible ${
              index === 0
                ? "bg-linear-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400"
                : index === 1
                  ? "bg-linear-to-r from-gray-100 to-gray-200 border-2 border-gray-400"
                  : index === 2
                    ? "bg-linear-to-r from-orange-100 to-orange-200 border-2 border-orange-400"
                    : "bg-gray-50 border-2 border-gray-200"
            }`}
          >
            {index < 3 && <SheepExplosion rank={index + 1} />}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-600">
                #{index + 1}
              </span>
              <span className="font-semibold text-lg">
                {player.playerName}
              </span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {player.score} pts
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          if (room) {
            room.send("player_ready", {});
            onPlayAgain();
          }
        }}
        className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-500 transition-colors"
      >
        Ready for Next Game
      </button>
    </div>
  );
}
