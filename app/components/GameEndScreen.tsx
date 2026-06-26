"use client";

import type { Room } from "colyseus.js";
import SheepExplosion from "./SheepExplosion";

interface GameEndData {
  results: Array<{
    rank: number;
    sessionId: string;
    playerName: string;
    score: number;
  }>;
  winner: string | null;
  winnerIds: string[];
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
  const winnerNames = gameEndData.results
    .filter((p) => gameEndData.winnerIds.includes(p.sessionId))
    .map((p) => p.playerName);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🎉 Game Results 🎉</h1>
        <div className="bg-linear-to-r from-yellow-400 to-orange-400 rounded-xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            {winnerNames.length > 1 ? "Winners" : "Winner"}:{" "}
            {winnerNames.length > 0 ? winnerNames.join(" & ") : "Unknown"}
          </h2>
          <p className="text-2xl text-white font-semibold">
            {gameEndData.results[0]?.score || 0} points
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
        {gameEndData.results.map((player, index) => {
          const isWinner = gameEndData.winnerIds.includes(player.sessionId);
          // Tied winners all occupy "1st place" visually — players below them
          // slide into 2nd/3rd regardless of their raw array index.
          const visualPosition = isWinner
            ? 1
            : index - gameEndData.winnerIds.length + 2;

          return (
            <div
              key={player.sessionId}
              className={`flex justify-between items-center p-4 rounded-lg relative overflow-visible ${
                isWinner
                  ? "bg-linear-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400"
                  : visualPosition === 2
                    ? "bg-linear-to-r from-gray-100 to-gray-200 border-2 border-gray-400"
                    : visualPosition === 3
                      ? "bg-linear-to-r from-orange-100 to-orange-200 border-2 border-orange-400"
                      : "bg-gray-50 border-2 border-gray-200"
              }`}
            >
              {visualPosition <= 3 && <SheepExplosion rank={visualPosition} />}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-600">
                  #{isWinner ? 1 : player.rank}
                </span>
                <span className="font-semibold text-lg">
                  {player.playerName}
                </span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {player.score} pts
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          if (room) {
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
