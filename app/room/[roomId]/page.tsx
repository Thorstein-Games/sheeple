"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameEvents } from "@/lib/socket/events";
import GameEndScreen from "@/app/components/GameEndScreen";
import ReadyRoom from "@/app/components/ReadyRoom";
import CountdownTimer from "@/app/components/CountdownTimer";
import Chat from "@/app/components/Chat";
import type {
  PlayerJoinedData,
  GameStartData,
  RoundStartData,
  RevealAnswersData,
  UpdateScoresData,
  GameEndData,
  RoomStateData,
  AnswerSubmittedData,
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
  const [savedAnswer, setSavedAnswer] = useState(""); // Track saved (but not submitted) answer
  const [revealedAnswers, setRevealedAnswers] =
    useState<RevealAnswersData | null>(null);
  const [scores, setScores] = useState<UpdateScoresData | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [readyPlayers, setReadyPlayers] = useState<Set<string>>(new Set());
  const [previousWinners, setPreviousWinners] = useState<Set<string>>(
    new Set(),
  );
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(
    new Set(),
  );
  const [showNextRoundButton, setShowNextRoundButton] = useState(false);
  const [totalRounds, setTotalRounds] = useState(5);

  // Ref to store the debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save effect for player answer
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't save if answer is empty, already submitted, or no socket
    if (!playerAnswer.trim() || hasSubmitted || !socket) {
      return;
    }

    // Set a new timer to save after 1 second of no typing
    debounceTimerRef.current = setTimeout(() => {
      setSavedAnswer(playerAnswer.trim());
      socket.emit(GameEvents.SAVE_ANSWER_DRAFT, {
        answer: playerAnswer.trim(),
      });
    }, 1000); // 1 second debounce

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [playerAnswer, hasSubmitted, socket]);

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
        })),
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
        currentPlayers.filter((p) => p.playerId !== data.playerId),
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
      if (data.totalRounds) {
        setTotalRounds(data.totalRounds);
      }
    });

    socket.on(GameEvents.ROUND_START, (data: RoundStartData) => {
      console.log("Round starting:", data);
      setCurrentRound(data);
      setPlayerAnswer("");
      setSavedAnswer("");
      setHasSubmitted(false);
      setRevealedAnswers(null);
      setSubmittedPlayers(new Set()); // Reset submission tracking for new round
      setShowNextRoundButton(false); // Hide button when new round starts
    });

    socket.on(GameEvents.ANSWER_SUBMITTED, (data: AnswerSubmittedData) => {
      if (data.playerId === socket.id) {
        setHasSubmitted(true);
      }
      // Track all player submissions
      setSubmittedPlayers((prev) => new Set(prev).add(data.playerId));
    });

    socket.on(GameEvents.REVEAL_ANSWERS, (data: RevealAnswersData) => {
      console.log("Revealing answers:", data);
      setRevealedAnswers(data);
    });

    socket.on(GameEvents.UPDATE_SCORES, (data: UpdateScoresData) => {
      console.log("Scores updated:", data);
      setScores(data);
      // Show "Next Round" button after scores are revealed
      setShowNextRoundButton(true);
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
    if (!socket || !playerAnswer.trim() || hasSubmitted) return;
    socket.emit(GameEvents.SUBMIT_ANSWER, {
      answer: playerAnswer.trim(),
    });
    setSavedAnswer(playerAnswer.trim());
  };

  const handleSaveAnswer = () => {
    // Immediate save on blur (cancels any pending debounce)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (playerAnswer.trim() && !hasSubmitted && socket) {
      setSavedAnswer(playerAnswer.trim());
      socket.emit(GameEvents.SAVE_ANSWER_DRAFT, {
        answer: playerAnswer.trim(),
      });
    }
  };

  const handleTimeUp = () => {
    // Auto-submit saved answer (or current answer) when time runs out
    if (!hasSubmitted && socket) {
      const answer = savedAnswer || playerAnswer.trim() || "[No answer]";
      socket.emit(GameEvents.SUBMIT_ANSWER, {
        answer: answer,
      });
      // Update local state to match what was submitted
      setPlayerAnswer(answer);
    }
  };

  const handlePlayAgain = () => {
    // Reset game state to go back to ready screen
    setGameEnded(false);
    setGameEndData(null);
    setGameStarted(false);
    setCurrentRound(null);
    setPlayerAnswer("");
    setSavedAnswer("");
    setHasSubmitted(false);
    setRevealedAnswers(null);
    setScores(null);
    setIsReady(true);
    setShowNextRoundButton(false);

    // Add current player to ready players
    if (socket?.id) {
      setReadyPlayers((prev) => new Set(prev).add(socket.id!));
    }
  };

  const handleNextRound = () => {
    if (!socket) return;
    socket.emit(GameEvents.NEXT_ROUND);
    setShowNextRoundButton(false); // Hide button after clicking
  };

  if (!contextPlayerName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {gameEnded && gameEndData ? (
          <GameEndScreen
            gameEndData={gameEndData}
            currentPlayerId={socket?.id}
            socket={socket}
            onPlayAgain={handlePlayAgain}
          />
        ) : !gameStarted ? (
          <ReadyRoom
            players={players}
            roomId={roomId}
            isConnected={isConnected}
            isReady={isReady}
            readyPlayers={readyPlayers}
            previousWinners={previousWinners}
            currentPlayerId={socket?.id}
            onPlayerReady={handlePlayerReady}
          />
        ) : (
          <div className="space-y-6">
            {currentRound && !revealedAnswers && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-6 flex justify-between items-start">
                  <div className="flex-1">
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
                  <div className="ml-6">
                    <CountdownTimer
                      timeLimit={currentRound.timeLimit}
                      onTimeUp={handleTimeUp}
                      socket={socket}
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
                        onChange={(e) => setPlayerAnswer(e.target.value)}
                        onKeyDown={(e) =>
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

                {/* Player Submission Status */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Player Status ({submittedPlayers.size}/{players.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player) => {
                      const hasSubmitted = submittedPlayers.has(
                        player.playerId,
                      );
                      return (
                        <div
                          key={player.playerId}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            hasSubmitted
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span className="text-lg">
                            {hasSubmitted ? "✓" : "○"}
                          </span>
                          <span className="text-sm truncate">
                            {player.playerName}
                            {player.playerId === socket?.id && " (You)"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                            (p) => p.playerId === playerId,
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

                {showNextRoundButton &&
                  currentRound &&
                  currentRound.roundNumber < totalRounds && (
                    <button
                      onClick={handleNextRound}
                      className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                    >
                      Next Round →
                    </button>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Component */}
      <Chat roomId={roomId} />
    </div>
  );
}
