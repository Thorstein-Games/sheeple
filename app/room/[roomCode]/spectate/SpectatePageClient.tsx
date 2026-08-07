"use client";

import { useEffect, useState } from "react";
import { useColyseus, getCurrentRoomCode } from "@/lib/colyseus/ColyseusProvider";
import { useSpectatorRoom } from "../useSpectatorRoom";
import type { Player } from "../useGameRoom";

function Scoreboard({ players, hostId }: { players: Player[]; hostId?: string }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <h2 className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-4">Scoreboard</h2>
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div
            key={p.sessionId}
            className="flex items-center justify-between gap-4 bg-gray-800 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-bold text-lg w-6">{i + 1}</span>
              <span className="text-white font-semibold text-xl">
                {p.playerName}
                {p.sessionId === hostId && (
                  <span className="ml-2 text-xs text-yellow-400">HOST</span>
                )}
              </span>
            </div>
            <span className="text-yellow-400 font-bold text-2xl tabular-nums">{p.score}</span>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-gray-600 text-center py-4">Waiting for players...</p>
        )}
      </div>
    </div>
  );
}

function LobbyView({ players, hostId }: { players: Player[]; hostId?: string }) {
  const readyCount = players.filter((p) => p.isReady).length;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl lg:text-4xl font-bold text-white">Waiting to start</h2>
      <p className="text-lg lg:text-2xl text-gray-400">
        {readyCount} / {players.length} players ready
      </p>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {players.map((p) => (
          <div
            key={p.sessionId}
            className={`flex items-center gap-3 rounded-xl px-5 py-4 ${
              p.isReady ? "bg-green-800/60 border border-green-600" : "bg-gray-800"
            }`}
          >
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${p.isReady ? "bg-green-400" : "bg-gray-600"}`} />
            <span className="text-white text-xl font-medium truncate">{p.playerName}</span>
            {p.sessionId === hostId && (
              <span className="ml-auto text-xs text-yellow-400 font-semibold flex-shrink-0">HOST</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptView({
  currentRound,
  totalRounds,
  players,
  submittedPlayers,
}: {
  currentRound: { roundNumber: number; prompt: string; timeLimit: number };
  totalRounds: number;
  players: Player[];
  submittedPlayers: Set<string>;
}) {
  return (
    <div className="space-y-8">
      <p className="text-gray-400 text-xl font-semibold tracking-wide uppercase">
        Round {currentRound.roundNumber} of {totalRounds}
      </p>
      <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">{currentRound.prompt}</h2>
      <div className="mt-6">
        <p className="text-gray-500 text-sm mb-3 uppercase tracking-widest">
          {submittedPlayers.size} / {players.length} answered
        </p>
        <div className="flex flex-wrap gap-3">
          {players.map((p) => (
            <span
              key={p.sessionId}
              className={`px-4 py-2 rounded-full text-base font-medium transition-colors ${
                submittedPlayers.has(p.sessionId)
                  ? "bg-green-700 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {submittedPlayers.has(p.sessionId) ? "✓ " : ""}{p.playerName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsView({
  revealedAnswers,
  currentRound,
  totalRounds,
}: {
  revealedAnswers: { answers: Array<{ sessionId: string; playerName: string; answer: string; points: number; count: number }> };
  currentRound: { roundNumber: number; prompt: string; timeLimit: number } | null;
  totalRounds: number;
}) {
  const sorted = [...revealedAnswers.answers].sort((a, b) => b.points - a.points);
  return (
    <div className="space-y-6">
      {currentRound && (
        <p className="text-gray-400 text-xl font-semibold tracking-wide uppercase">
          Round {currentRound.roundNumber} of {totalRounds} — Results
        </p>
      )}
      <div className="space-y-3">
        {sorted.map((a, i) => (
          <div
            key={a.sessionId}
            className="flex items-center justify-between bg-gray-800 rounded-2xl px-6 py-4"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <div>
                <p className="text-white text-2xl font-bold">"{a.answer}"</p>
                <p className="text-gray-400 text-base">{a.playerName}</p>
              </div>
            </div>
            <span className="text-yellow-400 font-bold text-3xl tabular-nums">+{a.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnerView({
  gameEndData,
}: {
  gameEndData: { results: Array<{ rank: number; sessionId: string; playerName: string; score: number }>; winner: string | null };
}) {
  const winner = gameEndData.winner;
  const podium = gameEndData.results.slice(0, 3);
  return (
    <div className="space-y-8 text-center">
      <div>
        <p className="text-4xl lg:text-5xl mb-4">🏆</p>
        <h2 className="text-3xl lg:text-5xl font-bold text-yellow-400">{winner ?? "Tie!"}</h2>
        <p className="text-gray-400 text-xl lg:text-2xl mt-2">wins the game!</p>
      </div>
      <div className="space-y-3 text-left">
        {podium.map((r) => (
          <div key={r.sessionId} className="flex items-center justify-between bg-gray-800 rounded-2xl px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
              <span className="text-white text-2xl font-bold">{r.playerName}</span>
            </div>
            <span className="text-yellow-400 font-bold text-2xl tabular-nums">{r.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpectatePageClient() {
  const { client } = useColyseus();
  // usePathname() / useParams() return "_" (pre-rendered shell param) in static
  // export. getCurrentRoomCode() uses sessionStorage → URL as authoritative sources.
  const [roomCode, setRoomCode] = useState("_");
  useEffect(() => {
    setRoomCode(getCurrentRoomCode());
  }, []);

  const {
    isConnected,
    hostId,
    players,
    submittedPlayers,
    gameStarted,
    gameEnded,
    gameEndData,
    currentRound,
    totalRounds,
    revealedAnswers,
  } = useSpectatorRoom(roomCode, client);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6" />
          <p className="text-gray-400 text-xl">Connecting to room {roomCode}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 lg:gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 lg:px-3 py-1 rounded-full uppercase tracking-widest">
            TV Mode
          </span>
          <span className="text-gray-400 text-base lg:text-lg font-mono">Room {roomCode}</span>
        </div>
        <p className="text-xl lg:text-2xl font-bold text-white">🐑 Sheeple</p>
      </div>

      {/* Body — stacks vertically on mobile, side-by-side on large screens */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 p-4 lg:p-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {gameEnded && gameEndData ? (
            <WinnerView gameEndData={gameEndData} />
          ) : gameStarted ? (
            revealedAnswers ? (
              <ResultsView
                revealedAnswers={revealedAnswers}
                currentRound={currentRound}
                totalRounds={totalRounds}
              />
            ) : currentRound ? (
              <PromptView
                currentRound={currentRound}
                totalRounds={totalRounds}
                players={players}
                submittedPlayers={submittedPlayers}
              />
            ) : (
              <div className="text-gray-400 text-3xl font-semibold">Next round starting...</div>
            )
          ) : (
            <LobbyView players={players} hostId={hostId} />
          )}
        </div>

        {/* Scoreboard — full-width on mobile, fixed sidebar on large screens */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <Scoreboard players={players} hostId={hostId} />
        </div>
      </div>
    </div>
  );
}
