"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { generateRandomPlayerName } from "@/lib/utils";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  playerName: string | null;
  setPlayerName: (name: string | null) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  playerName: null,
  setPlayerName: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerNameState] = useState<string | null>(null);

  // Initialize player name from sessionStorage on mount, or generate a random one
  useEffect(() => {
    const storedName = sessionStorage.getItem("playerName");
    if (storedName) {
      setPlayerNameState(storedName);
    } else {
      // Generate a random player name if none exists
      const randomName = generateRandomPlayerName();
      setPlayerNameState(randomName);
      sessionStorage.setItem("playerName", randomName);
    }
  }, []);

  // Sync playerName to sessionStorage whenever it changes
  const setPlayerName = (name: string | null) => {
    if (name) {
      setPlayerNameState(name);
      sessionStorage.setItem("playerName", name);
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
      value={{ socket, isConnected, playerName, setPlayerName }}
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
