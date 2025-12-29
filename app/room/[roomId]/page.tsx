"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameEvents } from "@/lib/socket/events";
import type {
  PlayerJoinedData,
  GameStartData,
  RoundStartData,
  RevealAnswersData,
  UpdateScoresData,
} from "@/lib/socket/types";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const roomId = params.roomId as string;

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerJoinedData[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundStartData | null>(null);
  const [playerAnswer, setPlayerAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealedAnswers, setRevealedAnswers] =
    useState<RevealAnswersData | null>(null);
  const [scores, setScores] = useState<UpdateScoresData | null>(null);

  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    if (!name) {
      router.push("/");
      return;
    }
    setPlayerName(name);
  }, [router]);

  useEffect(() => {
    if (!socket || !playerName) return;

    socket.emit(GameEvents.JOIN_GAME, {
      playerName,
      roomId,
    });

    socket.on(GameEvents.PLAYER_JOINED, (data: PlayerJoinedData) => {
      console.log("Player joined:", data);
      setPlayers((prev) => {
        // Avoid duplicates
        if (prev.some((p) => p.playerId === data.playerId)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    socket.on(GameEvents.PLAYER_LEFT, (data: { playerId: string }) => {
      console.log("Player left:", data);
      setPlayers((prev) => prev.filter((p) => p.playerId !== data.playerId));
    });

    socket.on(GameEvents.GAME_START, (data: GameStartData) => {
      console.log("Game starting:", data);
      setGameStarted(true);
    });

    socket.on(GameEvents.ROUND_START, (data: RoundStartData) => {
      console.log("Round starting:", data);
      setCurrentRound(data);
      setPlayerAnswer("");
      setHasSubmitted(false);
      setRevealedAnswers(null);
    });

    socket.on(GameEvents.ANSWER_SUBMITTED, () => {
      setHasSubmitted(true);
    });

    socket.on(GameEvents.REVEAL_ANSWERS, (data: RevealAnswersData) => {
      console.log("Revealing answers:", data);
      setRevealedAnswers(data);
    });

    socket.on(GameEvents.UPDATE_SCORES, (data: UpdateScoresData) => {
      console.log("Scores updated:", data);
      setScores(data);
    });

    socket.on(GameEvents.ERROR, (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(`Error: ${data.message}`);
    });

    return () => {
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.PLAYER_LEFT);
      socket.off(GameEvents.GAME_START);
      socket.off(GameEvents.ROUND_START);
      socket.off(GameEvents.ANSWER_SUBMITTED);
      socket.off(GameEvents.REVEAL_ANSWERS);
      socket.off(GameEvents.UPDATE_SCORES);
      socket.off(GameEvents.ERROR);
    };
  }, [socket, playerName, roomId]);

  const handlePlayerReady = () => {
    if (!socket) return;
    socket.emit(GameEvents.PLAYER_READY);
    setIsReady(true);
  };

  const handleSubmitAnswer = () => {
    if (!socket || !playerAnswer.trim()) return;
    socket.emit(GameEvents.SUBMIT_ANSWER, {
      answer: playerAnswer.trim(),
    });
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem("playerName");
    router.push("/");
  };

  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                🐑 Sheeple Game
              </h1>
              <p className="text-gray-600 mt-1">
                Room:{" "}
                <span className="font-mono font-bold text-lg">{roomId}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Playing as:</p>
              <p className="font-bold text-blue-600">{playerName}</p>
              <p className="text-sm mt-1">
                <span
                  className={`${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            ← Leave Room
          </button>
        </div>

        {!gameStarted ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Waiting for Players...</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Players in Room ({players.length})
              </h3>
              <div className="grid gap-3">
                {players.map((player) => (
                  <div
                    key={player.playerId}
                    className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 flex justify-between items-center"
                  >
                    <span className="font-medium">{player.playerName}</span>
                    <div className="flex items-center gap-2">
                      {player.playerId === socket?.id && (
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {players.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Waiting for players to join...
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              {!isReady ? (
                <button
                  onClick={handlePlayerReady}
                  disabled={!isConnected}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  I'm Ready! 🎮
                </button>
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-semibold">
                    ✓ You're Ready!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Waiting for other players...
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {currentRound && !revealedAnswers && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Round {currentRound.roundNumber}
                  </p>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {currentRound.prompt}
                  </h2>
                  <p className="text-gray-600">
                    Think like the herd! What will most people say?
                  </p>
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
                        onChange={(e) => setPlayerAnswer(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSubmitAnswer()
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="Type your answer..."
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!playerAnswer.trim()}
                      className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
                    <p className="text-blue-700 font-semibold text-lg">
                      ✓ Answer Submitted!
                    </p>
                    <p className="text-blue-600 mt-2">
                      Waiting for other players...
                    </p>
                  </div>
                )}
              </div>
            )}

            {revealedAnswers && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Round Results</h2>

                <div className="space-y-4">
                  {revealedAnswers.answers.map((answer) => (
                    <div
                      key={answer.playerId}
                      className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {answer.playerName}
                          </p>
                          <p className="text-lg mt-1">{answer.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {scores && (
                  <div className="mt-6 bg-gray-100 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Current Scores</h3>
                    <div className="space-y-2">
                      {Object.entries(scores.scores)
                        .sort(([, a], [, b]) => b - a)
                        .map(([playerId, score]) => {
                          const player = players.find(
                            (p) => p.playerId === playerId
                          );
                          return (
                            <div
                              key={playerId}
                              className="flex justify-between"
                            >
                              <span>{player?.playerName || playerId}</span>
                              <span className="font-bold">{score} pts</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
