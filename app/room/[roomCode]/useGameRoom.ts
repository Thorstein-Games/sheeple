"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Room } from "colyseus.js";
import type { ClientWithHTTPAPI } from "@/lib/colyseus/types";

export interface Player {
  sessionId: string;
  playerName: string;
  isReady: boolean;
  score: number;
}

export interface RoundData {
  roundNumber: number;
  prompt: string;
  timeLimit: number;
}

export interface RevealAnswersData {
  answers: Array<{
    sessionId: string;
    playerName: string;
    answer: string;
    points: number;
    count: number;
  }>;
}

export interface GameEndData {
  results: Array<{
    rank: number;
    sessionId: string;
    playerName: string;
    score: number;
  }>;
  winner: string | null;
  winnerIds: string[];
}

export function useGameRoom(
  roomCode: string,
  playerName: string | null,
  client: ClientWithHTTPAPI | null
) {
  const router = useRouter();

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
  const [previousWinners, setPreviousWinners] = useState<Set<string>>(new Set());
  const [readyPlayers, setReadyPlayers] = useState<Set<string>>(new Set());
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(new Set());
  const [hostId, setHostId] = useState<string | undefined>(undefined);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isConnected, setIsConnected] = useState(false);
  const joiningRef = useRef(false);

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
    syncOwnReadyState(readySet, currentRoom.sessionId);
  };

  // Keep the local "isReady" flag (which drives the Ready button) in sync with
  // the server's view of this player's ready state. Without this, a page
  // refresh leaves isReady stuck at false while the server still has the
  // player marked ready (their session survives reconnection-by-name), so the
  // Ready button reappears — and since the server's "ready" handler toggles
  // the flag, clicking it actually un-readies the player instead of confirming.
  const syncOwnReadyState = (readySet: Set<string>, ownSessionId: string | undefined) => {
    if (!ownSessionId) return;
    setIsReady(readySet.has(ownSessionId));
  };

  // Join Colyseus room
  useEffect(() => {
    if (!client || !playerName || !roomCode || room || joiningRef.current) return;

    joiningRef.current = true;

    const joinRoom = async () => {
      try {
        const joinedRoom = await client.join("sheeple_game", {
          playerName,
          roomCode,
        });

        // Register ALL message handlers FIRST, synchronously, before any other operations
        // This ensures handlers are ready before server messages from onJoin() arrive
        joinedRoom.onMessage("welcome", (data: any) => {
          console.log("Welcome:", data);
          setHostId(data.isHost ? data.sessionId : undefined);
          setIsReady(!!data.isReady);
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
        });

        joinedRoom.onMessage("game_ended", (data: any) => {
          console.log("Game ended:", data);
          setGameEnded(true);
          setGameEndData(data);
          // Store winner player names — stable across reconnects unlike session IDs.
          const winnerNames = new Set<string>(
            (data.results ?? [])
              .filter((r: any) => (data.winnerIds ?? []).includes(r.sessionId))
              .map((r: any) => r.playerName as string)
          );
          setPreviousWinners(winnerNames);
          setGameStarted(false);
          setIsReady(false);
        });

        joinedRoom.onMessage("host_changed", (data: any) => {
          console.log("Host changed:", data);
          setHostId(data.newHostId);

          if (data.newHostId === joinedRoom.sessionId) {
            toast.info("You are now the host", { duration: 4000 });
          }
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

        joinedRoom.onMessage("game_state_sync", (data: any) => {
          console.log("Game state sync:", data);
          if (data.previousWinnerPlayerNames?.length > 0) {
            setPreviousWinners(new Set<string>(data.previousWinnerPlayerNames));
          }
          if (data.gamePhase === "playing") {
            setGameStarted(true);
            setTotalRounds(data.totalRounds || 5);
            if (data.currentPrompt) {
              setCurrentRound({
                roundNumber: data.currentRound,
                prompt: data.currentPrompt,
                timeLimit: data.roundDuration,
              });
            }
            if (data.roundResults?.length > 0) {
              setRevealedAnswers({
                answers: data.roundResults.map((r: any) => ({
                  sessionId: r.sessionId,
                  playerName: r.playerName,
                  answer: r.answer,
                  points: r.points,
                  count: 1,
                })),
              });
            }
          } else if (data.gamePhase === "ended") {
            setGameEnded(true);
          }
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
            const readySet = new Set<string>(data.players.filter((p: any) => p.isReady).map((p: any) => p.sessionId as string));
            setReadyPlayers(readySet);
            syncOwnReadyState(readySet, joinedRoom.sessionId);
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
            const readySet = new Set<string>(data.players.filter((p: any) => p.isReady).map((p: any) => p.sessionId as string));
            setReadyPlayers(readySet);
            syncOwnReadyState(readySet, joinedRoom.sessionId);
            if (data.hostId) setHostId(data.hostId);
          } else {
            updatePlayersList(joinedRoom);
          }
        });

        joinedRoom.onMessage("error", (data: any) => {
          console.error("Room error:", data.message);
          toast.error(data.message);
        });

        joinedRoom.onMessage("kicked", (data: any) => {
          toast.error(data.reason || "You were removed from the room", { duration: 4000 });
          router.push("/lobby");
        });

        // All handlers registered — signal the server it can send welcome + player_list.
        joinedRoom.send("client_ready", {});

        setRoom(joinedRoom);
        setCurrentSessionId(joinedRoom.sessionId);
        setIsConnected(true);
        console.log(`Joined Colyseus room: ${roomCode}`);

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
  }, [client, playerName, roomCode]);

  // Cleanup room on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.leave().catch((err: any) => console.error("Error leaving room:", err));
      }
    };
  }, [room]);

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

  const handleKickPlayer = (sessionId: string) => {
    if (!room) return;
    room.send("kick_player", { sessionId });
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

  const handleNextRound = () => {
    if (!room) return;
    room.send("next_round", {});
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

  return {
    gameStarted,
    gameEnded,
    connection: {
      room,
      isConnected,
      currentSessionId,
      hostId,
    },
    players: {
      list: players,
      isReady,
      readyPlayers,
      previousWinners,
      submittedPlayers,
    },
    round: {
      currentRound,
      totalRounds,
      playerAnswer,
      setPlayerAnswer,
      hasSubmitted,
      revealedAnswers,
    },
    gameEnd: {
      gameEndData,
    },
    actions: {
      handlePlayerReady,
      handleStartGame,
      handleUpdatePlayerName,
      handleKickPlayer,
      handleSubmitAnswer,
      handleTimeUp,
      handleNextRound,
      handlePlayAgain,
    },
  };
}
