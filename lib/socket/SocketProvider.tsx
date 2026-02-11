"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { generateRandomPlayerName } from "@/lib/utils";

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
  playerId: string;
  playerName: string;
  isReady: boolean;
}

type SetPlayersAction = Player[] | ((prevPlayers: Player[]) => Player[]);

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  playerName: string | null;
  setPlayerName: (name: string | null) => void;
  players: Player[];
  setPlayers: (action: SetPlayersAction) => void;
  playerId: string;
  tabId: string;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  playerName: null,
  setPlayerName: () => {},
  players: [],
  setPlayers: () => {},
  playerId: "",
  tabId: "",
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [players, setPlayersState] = useState<Player[]>([]);
  const [playerId] = useState<string>(getOrCreatePlayerId());
  const [tabId] = useState<string>(getOrCreateTabId());

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
    // Initialize socket connection
    const socketInstance = io({
      path: "/socket.io/",
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        playerName,
        setPlayerName,
        players,
        setPlayers,
        playerId,
        tabId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
