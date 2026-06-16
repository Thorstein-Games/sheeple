"use client";

import type { Room } from "colyseus.js";
import CountdownTimer from "@/app/components/CountdownTimer";

interface Player {
  sessionId: string;
  playerName: string;
  isReady: boolean;
  score: number;
}

interface RoundData {
  roundNumber: number;
  prompt: string;
  timeLimit: number;
}

interface RoundPlayProps {
  currentRound: RoundData;
  totalRounds: number;
  players: Player[];
  currentSessionId: string | undefined;
  playerAnswer: string;
  hasSubmitted: boolean;
  submittedPlayers: Set<string>;
  room: Room | null;
  onAnswerChange: (answer: string) => void;
  onSubmitAnswer: () => void;
  onTimeUp: () => void;
}

export default function RoundPlay({
  currentRound,
  totalRounds,
  players,
  currentSessionId,
  playerAnswer,
  hasSubmitted,
  submittedPlayers,
  room,
  onAnswerChange,
  onSubmitAnswer,
  onTimeUp,
}: RoundPlayProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-6 flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            Round {currentRound.roundNumber} of {totalRounds}
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {currentRound.prompt}
          </h2>
          <p className="text-gray-600">
            Think like the herd! What will most people say?
          </p>
        </div>
        <div className="ml-6">
          <CountdownTimer
            timeLimit={currentRound.timeLimit}
            onTimeUp={onTimeUp}
            room={room}
            currentRound={currentRound.roundNumber}
          />
        </div>
      </div>

      {!hasSubmitted ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Your Answer
            </label>
            <input
              type="text"
              value={playerAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmitAnswer()}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Type your answer..."
              autoFocus
            />
          </div>
          <button
            onClick={onSubmitAnswer}
            disabled={!playerAnswer.trim()}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answer
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
          <p className="text-blue-700 font-semibold text-lg">
            ✓ Answer Submitted!
          </p>
          <p className="text-blue-600 mt-2 italic">{playerAnswer}</p>
          <p className="text-blue-600 mt-2">Waiting for other players...</p>
        </div>
      )}

      {/* Player Submission Status */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Player Status ({submittedPlayers.size}/{players.length})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player) => {
            const hasPlayerSubmitted = submittedPlayers.has(player.sessionId);
            return (
              <div
                key={player.sessionId}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  hasPlayerSubmitted
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className="text-lg">{hasPlayerSubmitted ? "✓" : "○"}</span>
                <span className="text-sm truncate">
                  {player.playerName}
                  {player.sessionId === currentSessionId && " (You)"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
