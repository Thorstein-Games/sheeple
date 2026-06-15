"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useColyseus } from "@/lib/colyseus/ColyseusProvider";
import GameEndScreen from "@/app/components/GameEndScreen";
import ReadyRoom from "@/app/components/ReadyRoom";
import CountdownTimer from "@/app/components/CountdownTimer";
import Chat from "@/app/components/Chat";
import type { Room } from "colyseus.js";

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

interface RevealAnswersData {
  answers: Array<{
    sessionId: string;
    playerName: string;
    answer: string;
    points: number;
    count: number;
  }>;
}

interface GameEndData {
  results: Array<{
    rank: number;
    playerName: string;
    score: number;
  }>;
  winner: string | null;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { playerName, client } = useColyseus();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [playerAnswer, setPlayerAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<RevealAnswersData | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [readyPlayers, setReadyPlayers] = useState<Set<string>>(new Set());
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(new Set());
  const [nextRoundCountdown, setNextRoundCountdown] = useState<number | null>(null);
  const nextRoundCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hostId, setHostId] = useState<string | undefined>(undefined);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isConnected, setIsConnected] = useState(false);
  const joiningRef = useRef(false);

  // Join Colyseus room
  useEffect(() => {
    if (!client || !playerName || !roomId || room || joiningRef.current) return;

    joiningRef.current = true;

    const joinRoom = async () => {
      try {
        const joinedRoom = await client.joinById(roomId, {
          playerName,
        });
        
        // Register ALL message handlers FIRST, synchronously, before any other operations
        // This ensures handlers are ready before server messages from onJoin() arrive
        joinedRoom.onMessage("welcome", (data: any) => {
          console.log("Welcome:", data);
          setHostId(data.isHost ? data.sessionId : undefined);
        });

        joinedRoom.onMessage("game_started", (data: any) => {
          console.log("Game started:", data);
          setGameStarted(true);
          setTotalRounds(data.totalRounds || 5);
          setRevealedAnswers(null);
          setGameEnded(false);
        });

        joinedRoom.onMessage("round_started", (data: any) => {
          console.log("Round started:", data);
          if (nextRoundCountdownRef.current) {
            clearInterval(nextRoundCountdownRef.current);
            nextRoundCountdownRef.current = null;
          }
          setNextRoundCountdown(null);
          setCurrentRound({
            roundNumber: data.round,
            prompt: data.prompt,
            timeLimit: data.duration,
          });
          setPlayerAnswer("");
          setHasSubmitted(false);
          setRevealedAnswers(null);
          setSubmittedPlayers(new Set());
        });

        joinedRoom.onMessage("answer_submitted", (data: any) => {
          console.log("Answer submitted:", data);
          setHasSubmitted(true);
        });

        joinedRoom.onMessage("player_submitted", (data: any) => {
          setSubmittedPlayers((prev) => new Set(prev).add(data.sessionId));
        });

        joinedRoom.onMessage("round_ended", (data: any) => {
          console.log("Round ended:", data);
          setRevealedAnswers({
            answers: data.results.map((r: any) => ({
              sessionId: r.sessionId,
              playerName: r.playerName,
              answer: r.answer,
              points: r.points,
              count: 1,
            })),
          });

          // Update scores directly from message data so they reflect the
          // newly added points regardless of when the schema patch arrives.
          const scoreMap = new Map<string, number>(
            data.results.map((r: any) => [r.sessionId, r.totalScore])
          );
          setPlayers((prev) =>
            prev.map((p) =>
              scoreMap.has(p.sessionId)
                ? { ...p, score: scoreMap.get(p.sessionId)! }
                : p
            )
          );

          if (!data.isGameComplete) {
            setNextRoundCountdown(8);
            nextRoundCountdownRef.current = setInterval(() => {
              setNextRoundCountdown((prev) => {
                if (prev === null || prev <= 1) {
                  clearInterval(nextRoundCountdownRef.current!);
                  nextRoundCountdownRef.current = null;
                  return null;
                }
                return prev - 1;
              });
            }, 1000);
          }
        });

        joinedRoom.onMessage("game_ended", (data: any) => {
          console.log("Game ended:", data);
          setGameEnded(true);
          setGameEndData(data);
          setGameStarted(false);
          setIsReady(false);
        });

        joinedRoom.onMessage("player_ready", (data: any) => {
          console.log("Player ready:", data);
          setReadyPlayers((prev) => new Set(prev).add(data.sessionId));
        });

        joinedRoom.onMessage("host_changed", (data: any) => {
          console.log("Host changed:", data);
          setHostId(data.newHostId);
        });

        joinedRoom.onMessage("player_joined", (data: any) => {
          console.log("Player joined:", data);
          updatePlayersList(joinedRoom);
        });

        joinedRoom.onMessage("player_reconnected", (data: any) => {
          console.log("Player reconnected:", data);
        });

        joinedRoom.onMessage("player_disconnected", (data: any) => {
          console.log("Player disconnected:", data);
        });

        joinedRoom.onMessage("player_list", (data: any) => {
          console.log("Player list:", data);
          if (data?.players) {
            setPlayers(data.players.map((p: any) => ({
              sessionId: p.sessionId,
              playerName: p.playerName,
              isReady: p.isReady,
              score: p.score || 0,
            })));
            setReadyPlayers(new Set(data.players.filter((p: any) => p.isReady).map((p: any) => p.sessionId as string)));
            if (data.hostId) setHostId(data.hostId);
          } else {
            updatePlayersList(joinedRoom);
          }
        });

        joinedRoom.onMessage("player_list_update", (data: any) => {
          console.log("Player list update:", data);
          if (data?.players) {
            setPlayers(data.players.map((p: any) => ({
              sessionId: p.sessionId,
              playerName: p.playerName,
              isReady: p.isReady,
              score: p.score || 0,
            })));
            setReadyPlayers(new Set(data.players.filter((p: any) => p.isReady).map((p: any) => p.sessionId as string)));
            if (data.hostId) setHostId(data.hostId);
          } else {
            updatePlayersList(joinedRoom);
          }
        });

        joinedRoom.onMessage("error", (data: any) => {
          console.error("Room error:", data.message);
          alert(`Error: ${data.message}`);
        });

        // All handlers registered — signal the server it can send welcome + player_list.
        joinedRoom.send("client_ready", {});

        setRoom(joinedRoom);
        setCurrentSessionId(joinedRoom.sessionId);
        setIsConnected(true);
        console.log(`Joined Colyseus room: ${roomId}`);

        // Set up state listeners (guard against undefined state.players)
        if (joinedRoom.state.players) {
          joinedRoom.state.players.onAdd((player: any, sessionId: string) => {
            console.log("Player added:", player.playerName, sessionId);
            updatePlayersList(joinedRoom);
          });

          joinedRoom.state.players.onRemove((player: any, sessionId: string) => {
            console.log("Player removed:", player.playerName, sessionId);
            updatePlayersList(joinedRoom);
          });

          joinedRoom.state.players.onChange((player: any, sessionId: string) => {
            console.log("Player changed:", player.playerName, sessionId);
            updatePlayersList(joinedRoom);
          });
        }

        // Initial player list update
        updatePlayersList(joinedRoom);
        
        // Get host ID from state
        if (joinedRoom.state.hostId) {
          setHostId(joinedRoom.state.hostId);
        }

        // Check if game is already started
        if (joinedRoom.state.gameStarted) {
          setGameStarted(true);
          setTotalRounds(joinedRoom.state.totalRounds || 5);
          
          // Check if round is active
          if (joinedRoom.state.currentPrompt) {
            setCurrentRound({
              roundNumber: joinedRoom.state.currentRound,
              prompt: joinedRoom.state.currentPrompt,
              timeLimit: joinedRoom.state.roundDuration,
            });
          }
        }

      } catch (error: any) {
        console.error("Failed to join Colyseus room:", error);
        joiningRef.current = false;
        if (error.code === 4212) {
          router.push("/lobby");
        }
      }
    };

    joinRoom();

    return () => {
      // Cleanup will happen on component unmount
    };
  }, [client, playerName, roomId]);

  // Cleanup room on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.leave().catch((err: any) => console.error("Error leaving room:", err));
      }
    };
  }, [room]);

  // Helper to update players list from room state
  const updatePlayersList = (currentRoom: Room) => {
    const playerList: Player[] = [];
    const readySet = new Set<string>();
    
    // Guard against undefined state.players (can happen before state sync completes)
    if (!currentRoom.state.players) {
      setPlayers(playerList);
      setReadyPlayers(readySet);
      return;
    }
    
    currentRoom.state.players.forEach((player: any, sessionId: string) => {
      playerList.push({
        sessionId,
        playerName: player.playerName,
        isReady: player.isReady,
        score: player.score || 0,
      });
      
      if (player.isReady) {
        readySet.add(sessionId);
      }
    });
    
    setPlayers(playerList);
    setReadyPlayers(readySet);
  };

  // Event handlers
  const handlePlayerReady = () => {
    if (!room) return;
    room.send("ready", {});
    setIsReady(true);
  };

  const handleStartGame = () => {
    if (!room) return;
    room.send("start_game", {});
  };

  const handleUpdatePlayerName = (newName: string) => {
    if (!room) return;
    room.send("update_player_name", { newName });
  };

  const handleSubmitAnswer = () => {
    if (!room || !playerAnswer.trim() || hasSubmitted) return;
    room.send("submit_answer", { answer: playerAnswer.trim() });
  };

  const handleTimeUp = () => {
    if (!hasSubmitted && room) {
      const answer = playerAnswer.trim() || "[No answer]";
      room.send("submit_answer", { answer });
      setPlayerAnswer(answer);
    }
  };

  const handlePlayAgain = () => {
    setGameEnded(false);
    setGameEndData(null);
    setGameStarted(false);
    setCurrentRound(null);
    setPlayerAnswer("");
    setHasSubmitted(false);
    setRevealedAnswers(null);
    setIsReady(true);
    
    if (room) {
      room.send("ready", {});
    }
  };


  if (!playerName) {
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
            currentPlayerId={currentSessionId || undefined}
            hostId={hostId}
            room={room}
            onPlayAgain={handlePlayAgain}
          />
        ) : !gameStarted ? (
          <ReadyRoom
            players={players.map(p => ({
              playerId: p.sessionId,
              playerName: p.playerName,
              isReady: p.isReady,
            }))}
            roomId={roomId}
            isConnected={isConnected}
            isReady={isReady}
            readyPlayers={readyPlayers}
            previousWinners={new Set()}
            currentPlayerId={currentSessionId || undefined}
            hostId={hostId}
            room={room}
            onPlayerReady={handlePlayerReady}
            onStartGame={handleStartGame}
            onUpdatePlayerName={handleUpdatePlayerName}
          />
        ) : (
          <div className="space-y-6">
            {currentRound && !revealedAnswers && (
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
                      onTimeUp={handleTimeUp}
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
                          <span className="text-lg">
                            {hasPlayerSubmitted ? "✓" : "○"}
                          </span>
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
            )}

            {revealedAnswers && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Round Results</h2>

                <div className="space-y-4 mb-6">
                  {revealedAnswers.answers.map((answer, index) => (
                    <div
                      key={index}
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
                          </p>
                          <p className="text-2xl mt-2 font-medium">
                            {answer.answer}
                          </p>
                        </div>
                        <div className="text-right">
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

                {/* Current Scores */}
                <div className="mt-6 bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Current Scores</h3>
                  <div className="space-y-2">
                    {[...players]
                      .sort((a, b) => b.score - a.score)
                      .map((player) => (
                        <div
                          key={player.sessionId}
                          className="flex justify-between"
                        >
                          <span>
                            {player.playerName}
                            {player.sessionId === currentSessionId && " (You)"}
                          </span>
                          <span className="font-bold">{player.score} pts</span>
                        </div>
                      ))}
                  </div>
                </div>

                {currentRound && currentRound.roundNumber < totalRounds && nextRoundCountdown !== null && (
                  <div className="w-full mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-700 font-semibold">
                      Next round starts in {nextRoundCountdown}...
                    </p>
                  </div>
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
