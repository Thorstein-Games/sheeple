"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket/SocketProvider";
import { GameEvents } from "@/lib/socket/events";
import type {
  JoinGameData,
  PlayerJoinedData,
  RoomInfo,
  RoomsListData,
} from "@/lib/socket/types";

interface GameLobbyProps {
  playerName: string;
}

export function GameLobby({ playerName }: GameLobbyProps) {
  const router = useRouter();
  const { socket, isConnected, playerId, tabId } = useSocket();
  const [roomId, setRoomId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);

  // Join the lobby room for chat purposes
  useEffect(() => {
    if (!socket || !isConnected || !playerName || hasJoinedLobby) return;

    // Join a special "lobby" room for chat
    socket.emit(GameEvents.JOIN_GAME, {
      playerName: playerName,
      roomId: "lobby",
      isPrivate: true, // Make it private so it doesn't show up in room lists
      playerId,
      tabId,
    });

    setHasJoinedLobby(true);
  }, [socket, isConnected, playerName, hasJoinedLobby, playerId, tabId]);

  useEffect(() => {
    if (!socket) return;

    // Request rooms list when connected
    if (isConnected) {
      socket.emit(GameEvents.GET_ROOMS);
    }

    socket.on(GameEvents.ROOMS_LIST, (data: RoomsListData) => {
      setRooms(data.rooms);
    });

    socket.on(GameEvents.PLAYER_JOINED, (data: PlayerJoinedData) => {
      // Don't navigate if it's the lobby room
      if (data.roomId !== "lobby") {
        router.push(`/room/${data.roomId}`);
      }
    });

    socket.on(GameEvents.ROOM_STATE, (data: { roomId: string }) => {
      // Don't navigate if it's the lobby room
      if (data.roomId !== "lobby") {
        router.push(`/room/${data.roomId}`);
      }
    });

    socket.on(GameEvents.ERROR, (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(`Error: ${data.message}`);
    });

    // Refresh rooms list every 30 seconds
    const interval = setInterval(() => {
      if (socket && isConnected) {
        socket.emit(GameEvents.GET_ROOMS);
      }
    }, 30000);

    return () => {
      socket.off(GameEvents.ROOMS_LIST);
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.ROOM_STATE);
      socket.off(GameEvents.ERROR);
      clearInterval(interval);
    };
  }, [socket, router, isConnected]);

  const handleJoinGame = (targetRoomId?: string, forcePublic?: boolean) => {
    if (!socket) return;

    const data: JoinGameData = {
      playerName: playerName,
      roomId: targetRoomId || roomId.trim() || undefined,
      isPrivate: forcePublic ? false : targetRoomId ? false : isPrivate,
      playerId,
      tabId,
    };

    socket.emit(GameEvents.JOIN_GAME, data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Sheeple Game Lobby</h1>
          <p className="text-xl font-bold text-blue-600">{playerName}</p>
        </div>

        {/* Create/Join Room Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Create or Join a Room</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Room ID (optional)
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank to create new room"
              />
            </div>

            {!roomId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privateRoom"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="privateRoom"
                  className="text-sm font-medium text-gray-700"
                >
                  Make this a private room (requires room ID to join)
                </label>
              </div>
            )}

            <button
              onClick={() => handleJoinGame()}
              disabled={!isConnected}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {roomId
                ? `Join Room ${roomId}`
                : isPrivate
                  ? "Create Private Room"
                  : "Create Public Room"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Rooms</h2>
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No active rooms. Create one! 🙂
          </p>
        ) : (
          <div className="grid gap-3">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  room.isPrivate ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-lg">
                      Room {room.roomId}
                      {room.isPrivate && (
                        <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          🔒 Private
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {room.playerCount} / {room.maxPlayers} players
                      {room.isGameStarted && (
                        <span className="ml-2 text-orange-600 font-medium">
                          • Game in progress
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinGame(room.roomId)}
                  disabled={
                    !isConnected ||
                    room.playerCount >= room.maxPlayers ||
                    room.isGameStarted ||
                    room.isPrivate
                  }
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {room.isPrivate
                    ? "Private"
                    : room.isGameStarted
                      ? "In Progress"
                      : room.playerCount >= room.maxPlayers
                        ? "Full"
                        : "Join"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
