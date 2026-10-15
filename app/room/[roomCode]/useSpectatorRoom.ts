"use client";

import { useEffect, useRef, useState } from "react";
import type { Room } from "@colyseus/sdk";
import type { ClientWithHTTPAPI } from "@/lib/colyseus/types";
import type { Player, RoundData, RevealAnswersData, GameEndData } from "./useGameRoom";

export function useSpectatorRoom(
  roomCode: string,
  client: ClientWithHTTPAPI | null,
) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(new Set());
  const [hostId, setHostId] = useState<string | undefined>(undefined);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [totalRounds, setTotalRounds] = useState(5);
  const [revealedAnswers, setRevealedAnswers] = useState<RevealAnswersData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joiningRef = useRef(false);

  const buildPlayerList = (state: any): Player[] => {
    const list: Player[] = [];
    if (!state?.players) return list;
    state.players.forEach((p: any, sid: string) => {
      list.push({ sessionId: sid, playerName: p.playerName, isReady: p.isReady, score: p.score || 0 });
    });
    return list;
  };

  // Reconstruct results from schema state when joining mid-results-phase.
  const buildRevealedAnswers = (state: any): RevealAnswersData | null => {
    if (!state?.answers || state.answers.size === 0) return null;
    const results: RevealAnswersData["answers"] = [];
    state.answers.forEach((answer: string, sid: string) => {
      const player = state.players?.get(sid);
      const points = state.roundPoints?.get(sid) ?? 0;
      if (player) {
        results.push({ sessionId: sid, playerName: player.playerName, answer, points, count: 1 });
      }
    });
    return { answers: results };
  };

  // Derive all React state from the schema state snapshot. Called on initial join
  // and on the first onStateChange to handle async state arrival.
  const syncFromState = (state: any) => {
    if (!state) return;

    if (state.hostId) setHostId(state.hostId);
    setPlayers(buildPlayerList(state));

    const started: boolean = state.gameStarted ?? false;
    setGameStarted(started);
    if (started && state.totalRounds) setTotalRounds(state.totalRounds);

    if (!started) return;

    const phase: string = state.roundPhase ?? "waiting";

    if (phase === "prompt") {
      setCurrentRound({ roundNumber: state.currentRound, prompt: state.currentPrompt, timeLimit: state.roundDuration });
      setRevealedAnswers(null);
      const submitted = new Set<string>();
      state.answers?.forEach((_: string, sid: string) => submitted.add(sid));
      setSubmittedPlayers(submitted);
    } else if (phase === "answers" || phase === "results") {
      setCurrentRound({ roundNumber: state.currentRound, prompt: state.currentPrompt, timeLimit: state.roundDuration });
      setRevealedAnswers(buildRevealedAnswers(state));
      setSubmittedPlayers(new Set());
    } else {
      // "waiting" — between rounds
      setCurrentRound(null);
      setRevealedAnswers(null);
      setSubmittedPlayers(new Set());
    }
  };

  useEffect(() => {
    // "_" is the prerendered placeholder until the real code is read from the
    // URL. Joining it fails, and would block the real join while in flight.
    if (!client || !roomCode || roomCode === "_" || room || joiningRef.current) return;
    joiningRef.current = true;

    const join = async () => {
      try {
        const joinedRoom = await client.join("sheeple_game", {
          roomCode: roomCode.toUpperCase(),
          spectator: true,
        });

        // Register ALL handlers before client_ready so no messages are missed.

        joinedRoom.onMessage("welcome", (data: any) => {
          if (data.hostId) setHostId(data.hostId);
        });

        joinedRoom.onMessage("player_list", (data: any) => {
          if (data?.players) {
            setPlayers(data.players.map((p: any) => ({
              sessionId: p.sessionId,
              playerName: p.playerName,
              isReady: p.isReady,
              score: p.score || 0,
            })));
            if (data.hostId) setHostId(data.hostId);
          } else {
            setPlayers(buildPlayerList(joinedRoom.state));
          }
        });

        // Player changes arrive as state patches (see onStateChange below).
        ["player_joined", "player_reconnected", "player_disconnected", "player_removed", "spectator_joined", "spectator_left"].forEach(
          (type) => joinedRoom.onMessage(type, () => {}),
        );
        joinedRoom.onMessage("player_list_update", (data: any) => {
          if (data?.players) {
            setPlayers(data.players.map((p: any) => ({
              sessionId: p.sessionId,
              playerName: p.playerName,
              isReady: p.isReady,
              score: p.score || 0,
            })));
            if (data.hostId) setHostId(data.hostId);
          } else {
            setPlayers(buildPlayerList(joinedRoom.state));
          }
        });

        joinedRoom.onMessage("host_changed", (data: any) => setHostId(data.newHostId));

        joinedRoom.onMessage("game_started", (data: any) => {
          setGameStarted(true);
          setTotalRounds(data.totalRounds || 5);
          setRevealedAnswers(null);
          setGameEnded(false);
        });

        joinedRoom.onMessage("round_started", (data: any) => {
          setCurrentRound({ roundNumber: data.round, prompt: data.prompt, timeLimit: data.duration });
          setRevealedAnswers(null);
          setSubmittedPlayers(new Set());
        });

        joinedRoom.onMessage("player_submitted", (data: any) => {
          setSubmittedPlayers((prev) => new Set(prev).add(data.sessionId));
        });

        joinedRoom.onMessage("round_ended", (data: any) => {
          setRevealedAnswers({
            answers: data.results.map((r: any) => ({
              sessionId: r.sessionId,
              playerName: r.playerName,
              answer: r.answer,
              points: r.points,
              count: 1,
            })),
          });
          const scoreMap = new Map<string, number>(data.results.map((r: any) => [r.sessionId, r.totalScore]));
          setPlayers((prev) =>
            prev.map((p) => scoreMap.has(p.sessionId) ? { ...p, score: scoreMap.get(p.sessionId)! } : p)
          );
        });

        joinedRoom.onMessage("game_ended", (data: any) => {
          setGameEnded(true);
          setGameEndData(data);
          setGameStarted(false);
        });

        joinedRoom.onMessage("error", (data: any) => {
          console.error("[Spectator] Room error:", data.message);
        });

        joinedRoom.send("client_ready", {});

        setRoom(joinedRoom);
        setIsConnected(true);

        // Sync from current state immediately (handles pre-populated state)
        // then again on first patch (handles async state arrival after join).
        syncFromState(joinedRoom.state);
        joinedRoom.onStateChange.once(syncFromState);

        // After that, keep the player list and host live from every patch.
        joinedRoom.onStateChange((state: any) => {
          setPlayers(buildPlayerList(state));
          if (state.hostId) setHostId(state.hostId);
        });
        joinedRoom.reconnection.enabled = false;

      } catch (error: any) {
        console.error("[Spectator] Failed to join room:", error);
        joiningRef.current = false;
      }
    };

    join();
  }, [client, roomCode]);

  useEffect(() => {
    return () => {
      if (room) room.leave().catch(() => {});
    };
  }, [room]);

  return {
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
  };
}
