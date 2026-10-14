"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import * as Colyseus from "@colyseus/sdk";
import type { ClientWithHTTPAPI } from "@/lib/colyseus/types";
import { generateRandomPlayerName } from "@/lib/utils";
import { getGameServerUrl } from "@/lib/config/gameConfig";

// Import schema classes so they're available for Colyseus state deserialization
import { BaseGameState, Player as PlayerSchema } from "@/lib/colyseus/schema/BaseGameState";
import { SheepleState } from "@/lib/colyseus/schema/SheepleState";
import { appPathname } from "@/lib/basePath";

// Register schemas (this ensures they're loaded)
// Just importing them is enough, but we can reference them to prevent tree-shaking
const SCHEMAS = [BaseGameState, PlayerSchema, SheepleState];

// Generate a unique ID for this browser/player (persists across tabs and sessions)
function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let playerId = localStorage.getItem("playerId");
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("playerId", playerId);
  }
  return playerId;
}

// Generate a unique ID for this specific tab (only persists for this tab)
function getOrCreateTabId(): string {
  if (typeof window === "undefined") return "";
  let tabId = sessionStorage.getItem("tabId");
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem("tabId", tabId);
  }
  return tabId;
}

export interface Player {
  sessionId: string;
  playerName: string;
  isReady: boolean;
  isHost: boolean;
  score: number;
}

type SetPlayersAction = Player[] | ((prevPlayers: Player[]) => Player[]);

interface ColyseusContextType {
  client: ClientWithHTTPAPI | null;
  room: Colyseus.Room | null;
  isConnected: boolean;
  playerName: string | null;
  setPlayerName: (name: string | null) => void;
  players: Player[];
  setPlayers: (action: SetPlayersAction) => void;
  playerId: string;
  tabId: string;
  sessionId: string | null;
}

const ColyseusContext = createContext<ColyseusContextType>({
  client: null,
  room: null,
  isConnected: false,
  playerName: null,
  setPlayerName: () => {},
  players: [],
  setPlayers: () => {},
  playerId: "",
  tabId: "",
  sessionId: null,
});

export function ColyseusProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ClientWithHTTPAPI | null>(null);
  const [room, setRoom] = useState<Colyseus.Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [players, setPlayersState] = useState<Player[]>([]);
  const [playerId] = useState<string>(getOrCreatePlayerId());
  const [tabId] = useState<string>(getOrCreateTabId());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const clientRef = useRef<ClientWithHTTPAPI | null>(null);

  // Wrapper to match our type signature
  const setPlayers = (action: SetPlayersAction) => {
    if (typeof action === "function") {
      setPlayersState(action);
    } else {
      setPlayersState(action);
    }
  };

  // Initialize player name from localStorage on mount, or generate a random one
  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setPlayerNameState(storedName);
    } else {
      // Generate a random player name if none exists
      const randomName = generateRandomPlayerName();
      setPlayerNameState(randomName);
      localStorage.setItem("playerName", randomName);
    }
  }, []);

  // Sync playerName to localStorage whenever it changes
  const setPlayerName = (name: string | null) => {
    if (name) {
      setPlayerNameState(name);
      if (typeof window !== "undefined") {
        localStorage.setItem("playerName", name);
      }
    }
  };

  useEffect(() => {
    // Initialize Colyseus client
    const gameServerUrl = getGameServerUrl();
    console.log(`Connecting to Colyseus server at ${gameServerUrl}`);

    try {
      const colyseusClient = new Colyseus.Client(gameServerUrl) as ClientWithHTTPAPI;

      setClient(colyseusClient);
      clientRef.current = colyseusClient;
      setIsConnected(true);
      console.log("Connected to Colyseus server");
    } catch (err) {
      console.error("Failed to connect to Colyseus server:", err);
      setIsConnected(false);
    }

    // Cleanup on unmount
    return () => {
      if (room) {
        room.leave();
      }
      setIsConnected(false);
    };
  }, []);

  // Sync players from room state
  useEffect(() => {
    if (!room) return;

    const updatePlayers = () => {
      const playerList: Player[] = [];
      room.state.players?.forEach((player: any, sessionId: string) => {
        playerList.push({
          sessionId,
          playerName: player.playerName,
          isReady: player.isReady,
          isHost: player.isHost,
          score: player.score,
        });
      });
      setPlayersState(playerList);
    };

    // Initial sync
    updatePlayers();

    // Re-read the players after every state patch.
    room.onStateChange(updatePlayers);

    // Set session ID
    setSessionId(room.sessionId);

    return () => {
      room.onStateChange.remove(updatePlayers);
    };
  }, [room]);

  return (
    <ColyseusContext.Provider
      value={{
        client,
        room,
        isConnected,
        playerName,
        setPlayerName,
        players,
        setPlayers,
        playerId,
        tabId,
        sessionId,
      }}
    >
      {children}
    </ColyseusContext.Provider>
  );
}

export function useColyseus() {
  const context = useContext(ColyseusContext);
  if (context === undefined) {
    throw new Error("useColyseus must be used within a ColyseusProvider");
  }
  return context;
}

// Module-level handoff: lobby sets these before navigating to the room page so
// the room page can take ownership of the live connection without leaving and
// rejoining (which would dispose a freshly-created room).
//
// The room code is also written to sessionStorage so it survives a full-page
// reload (e.g. Ctrl+R), where module-level variables are reset.
// useParams() / usePathname() are NOT reliable in static export — they return
// the pre-rendered shell param ("_") rather than the actual URL segment.
let _pendingGameRoom: Colyseus.Room | null = null;
let _pendingRoomCode: string | null = null;

export function setPendingGameRoom(room: Colyseus.Room, roomCode: string): void {
  _pendingGameRoom = room;
  _pendingRoomCode = roomCode;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("currentRoomCode", roomCode);
  }
}

export function takePendingGameRoom(): Colyseus.Room | null {
  const r = _pendingGameRoom;
  _pendingGameRoom = null;
  _pendingRoomCode = null;
  return r;
}

/** Returns the current room code from the most authoritative source available. */
export function getCurrentRoomCode(): string {
  // 1. Module var — set explicitly before client-side navigation (most reliable).
  if (_pendingRoomCode) return _pendingRoomCode;
  // 2. sessionStorage — survives a full-page reload.
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem("currentRoomCode");
    if (stored) return stored;
  }
  // 3. URL — fallback for direct navigation (shared link, manual address entry).
  if (typeof window !== "undefined") {
    return appPathname().split("/")[2]?.toUpperCase() ?? "_";
  }
  return "_";
}

// Helper hook to manage room connection
export function useRoom() {
  const { client, room, playerName, playerId, tabId } = useColyseus();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async (options?: {
    isPrivate?: boolean;
    maxRounds?: number;
  }) => {
    if (!client || !playerName) {
      setError("Client not initialized or player name not set");
      return null;
    }

    setIsJoining(true);
    setError(null);

    try {
      const newRoom = await client.create("sheeple", {
        playerName,
        playerId,
        tabId,
        ...options,
      });
      return newRoom;
    } catch (err: any) {
      console.error("Failed to create room:", err);
      setError(err.message || "Failed to create room");
      return null;
    } finally {
      setIsJoining(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!client || !playerName) {
      setError("Client not initialized or player name not set");
      return null;
    }

    setIsJoining(true);
    setError(null);

    try {
      const newRoom = await client.joinById(roomId, {
        playerName,
        playerId,
        tabId,
      });
      return newRoom;
    } catch (err: any) {
      console.error("Failed to join room:", err);
      setError(err.message || "Failed to join room");
      return null;
    } finally {
      setIsJoining(false);
    }
  };

  const leaveRoom = async () => {
    if (room) {
      try {
        await room.leave();
      } catch (err) {
        console.error("Error leaving room:", err);
      }
    }
  };

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    isJoining,
    error,
  };
}
