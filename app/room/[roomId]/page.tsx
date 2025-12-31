"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameEvents } from "@/lib/socket/events";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/constants";
import type {
  PlayerJoinedData,
  GameStartData,
  RoundStartData,
  RevealAnswersData,
  UpdateScoresData,
  GameEndData,
  RoomStateData,
} from "@/lib/socket/types";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const {
    socket,
    isConnected,
    playerName: contextPlayerName,
    players,
    setPlayers,
  } = useSocket();
  const roomId = params.roomId as string;

  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundStartData | null>(null);
  const [playerAnswer, setPlayerAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealedAnswers, setRevealedAnswers] =
    useState<RevealAnswersData | null>(null);
  const [scores, setScores] = useState<UpdateScoresData | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [readyPlayers, setReadyPlayers] = useState<Set<string>>(new Set());
  const [previousWinners, setPreviousWinners] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!contextPlayerName) {
      router.push("/");
    }
  }, [contextPlayerName, router]);

  useEffect(() => {
    if (!socket || !contextPlayerName || hasJoined) return;

    socket.emit(GameEvents.JOIN_GAME, {
      playerName: contextPlayerName,
      roomId,
    });
    setHasJoined(true);
  }, [socket, contextPlayerName, roomId, hasJoined]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data: PlayerJoinedData) => {
      // Room state will be the source of truth, so we can just add new players
      setPlayers((currentPlayers) => {
        // Avoid duplicates
        if (currentPlayers.some((p) => p.playerId === data.playerId)) {
          return currentPlayers;
        }
        return [
          ...currentPlayers,
          {
            playerId: data.playerId,
            playerName: data.playerName,
            isReady: false,
          },
        ];
      });
    };

    const handleRoomState = (data: RoomStateData) => {
      setPlayers(
        data.players.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          isReady: p.isReady,
        }))
      );

      const readyPlayerIds = data.players
        .filter((p) => p.isReady)
        .map((p) => p.playerId);
      setReadyPlayers(new Set(readyPlayerIds));

      // Update previous winners
      if (data.previousWinners && data.previousWinners.length > 0) {
        setPreviousWinners(new Set(data.previousWinners));
      }
    };

    const handlePlayerReadyStatus = (data: {
      playerId: string;
      playerName: string;
    }) => {
      setReadyPlayers((prev) => new Set(prev).add(data.playerId));
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      console.log("Player left:", data);
      setPlayers((currentPlayers) =>
        currentPlayers.filter((p) => p.playerId !== data.playerId)
      );
      setReadyPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.playerId);
        return newSet;
      });
    };

    socket.on(GameEvents.PLAYER_JOINED, handlePlayerJoined);
    socket.on(GameEvents.ROOM_STATE, handleRoomState);
    socket.on(GameEvents.PLAYER_READY_STATUS, handlePlayerReadyStatus);
    socket.on(GameEvents.PLAYER_LEFT, handlePlayerLeft);

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

    socket.on(GameEvents.GAME_END, (data: GameEndData) => {
      console.log("Game ended:", data);
      setGameEnded(true);
      setGameEndData(data);
    });

    socket.on(GameEvents.ERROR, (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(`Error: ${data.message}`);
    });

    return () => {
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.ROOM_STATE);
      socket.off(GameEvents.PLAYER_LEFT);
      socket.off(GameEvents.GAME_START);
      socket.off(GameEvents.ROUND_START);
      socket.off(GameEvents.ANSWER_SUBMITTED);
      socket.off(GameEvents.REVEAL_ANSWERS);
      socket.off(GameEvents.UPDATE_SCORES);
      socket.off(GameEvents.GAME_END);
      socket.off(GameEvents.ERROR);
      socket.off(GameEvents.PLAYER_READY_STATUS);
    };
  }, [socket]);

  const handlePlayerReady = () => {
    if (!socket || !socket.id) return;
    socket.emit(GameEvents.PLAYER_READY);
    setIsReady(true);
    setReadyPlayers((prev) => new Set(prev).add(socket.id!));
  };

  const handleSubmitAnswer = () => {
    if (!socket || !playerAnswer.trim()) return;
    socket.emit(GameEvents.SUBMIT_ANSWER, {
      answer: playerAnswer.trim(),
    });
  };

  if (!contextPlayerName) {
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
        {gameEnded && gameEndData ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">🎉 Game Over! 🎉</h1>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-6 mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Winner: {gameEndData.winner.playerName}
                </h2>
                <p className="text-2xl text-white font-semibold">
                  {gameEndData.winner.score} points
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
              {gameEndData.players.map((player, index) => (
                <div
                  key={player.playerId}
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
                      {player.playerName}
                      {player.playerId === socket?.id && (
                        <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {player.score} pts
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        ) : !gameStarted ? (
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
                      {player.playerName}
                    </span>
                    <div className="flex items-center gap-2">
                      {readyPlayers.has(player.playerId) && (
                        <span className="text-sm bg-green-600 text-white px-2 py-1 rounded">
                          ✓ Ready
                        </span>
                      )}
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

            {players.length < MIN_PLAYERS && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">🎮 Game Requirements:</span>{" "}
                  You need at least {MIN_PLAYERS} players to start the game.
                  Share the room code{" "}
                  <span className="font-mono font-bold">{roomId}</span> with
                  your friends!
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              {!isReady ? (
                <button
                  onClick={handlePlayerReady}
                  disabled={!isConnected || players.length < MIN_PLAYERS}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg cursor-pointer hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Ready
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
              {!isReady && players.length < MIN_PLAYERS && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  Ready button will be enabled once {MIN_PLAYERS} players join
                </p>
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
                    <p className="text-blue-600 mt-2 italic">{playerAnswer}</p>
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

                <div className="space-y-4 mb-6">
                  {revealedAnswers.answers.map((answer) => (
                    <div
                      key={answer.playerId}
                      className={`border-2 rounded-lg p-4 ${
                        answer.points > 0
                          ? "bg-green-50 border-green-400"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            {answer.playerName}
                            {answer.playerId === socket?.id && (
                              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-2xl mt-2 font-medium">
                            {answer.answer}
                          </p>
                        </div>
                        <div className="text-right">
                          {answer.count > 1 && (
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-1">
                              {answer.count} players matched!
                            </div>
                          )}
                          <div
                            className={`text-2xl font-bold ${
                              answer.points > 0
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            +{answer.points} pts
                          </div>
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
