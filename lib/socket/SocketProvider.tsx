"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { generateRandomPlayerName } from "@/lib/utils";

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
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  playerName: null,
  setPlayerName: () => {},
  players: [],
  setPlayers: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [players, setPlayersState] = useState<Player[]>([]);

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
      localStorage.setItem("playerName", name);
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
