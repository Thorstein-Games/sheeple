"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useColyseus } from "@/lib/colyseus/ColyseusProvider";
import {
  joinLobby,
  joinOrCreateGameRoom,
  joinGameRoomAsSpectator,
  getRoomCode,
} from "@/lib/colyseus/RoomService";
import { setPendingGameRoom } from "@/lib/colyseus/ColyseusProvider";
import type { RoomInfo } from "@/shared/schema/RoomMetadata";
import type { Room } from "colyseus.js";
import Chat, { type ChatEntry } from "./Chat";

const LOBBY_CHAT_LIMIT = 50;

interface GameLobbyProps {
  playerName: string;
}

export function GameLobby({ playerName }: GameLobbyProps) {
  const router = useRouter();
  const { client, isConnected, playerId, tabId } = useColyseus();
  const [roomCode, setRoomCode] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [lobbyRoom, setLobbyRoom] = useState<Room | null>(null);
  const [lobbyChat, setLobbyChat] = useState<ChatEntry[]>([]);

  // Join the lobby room once per mount and use WebSocket messages for room listing.
  // (This used to also depend on a "has joined" flag it set itself, so joining
  // re-ran the effect and its cleanup left the lobby it had just joined.)
  useEffect(() => {
    if (!client || !isConnected || !playerName) return;

    let cancelled = false;
    let room: Room | null = null;
    let refreshInterval: ReturnType<typeof setInterval> | undefined;

    joinLobby(client, playerName, playerId, tabId).then((joinedRoom) => {
      if (cancelled) {
        joinedRoom.leave();
        return;
      }
      room = joinedRoom;

      joinedRoom.onMessage('lobby_joined', (data: any) => {
        console.log('Lobby joined:', data);
      });

      // megingjord's shared lobby chat: { sender, text, timestamp } (no history).
      joinedRoom.onMessage('chat', (data: { sender: string; text: string; timestamp: number }) => {
        setLobbyChat((prev) =>
          [...prev, { playerName: data.sender, message: data.text, timestamp: data.timestamp }].slice(-LOBBY_CHAT_LIMIT),
        );
      });
      setLobbyRoom(joinedRoom);

      joinedRoom.onMessage('room_list', (data: any) => {
        setRooms((data.rooms || []).map((r: any): RoomInfo => ({
          roomId: r.roomId,
          roomCode: r.roomCode,
          playerCount: r.playerCount,
          maxPlayers: r.maxPlayers,
          gameStarted: r.isStarted,
          isPrivate: false,
          hostName: r.hostName,
          gameType: r.roomType,
        })));
      });

      joinedRoom.send('list_rooms', {});
      refreshInterval = setInterval(() => joinedRoom.send('list_rooms', {}), 30000);
    });

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
      setLobbyRoom(null);
      room?.leave();
    };
  }, [client, isConnected, playerName, playerId, tabId]);

  const handleJoinGame = async (
    targetRoomCode?: string,
    forcePublic?: boolean,
  ) => {
    if (!client) return;

    try {
      const room = await joinOrCreateGameRoom(client, playerName, {
        roomCode: targetRoomCode || roomCode,
        isPrivate,
        playerId,
        tabId,
        forcePublic,
      });
      const targetCode = await getRoomCode(room);
      setPendingGameRoom(room, targetCode); // hand off live connection — room page takes ownership
      router.push(`/room/${targetCode}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleWatchGame = async (targetRoomCode: string) => {
    if (!client) return;
    try {
      const room = await joinGameRoomAsSpectator(client, targetRoomCode);
      const targetCode = await getRoomCode(room);
      await room.leave();
      router.push(`/room/${targetCode}/spectate`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
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
                Room Code (optional)
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank to create new room"
              />
            </div>

            {!roomCode && (
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
              {roomCode
                ? `Join Room ${roomCode}`
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
                      Room {room.roomCode}
                      {room.isPrivate && (
                        <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          🔒 Private
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {room.playerCount} / {room.maxPlayers} players
                      {room.gameStarted && (
                        <span className="ml-2 text-orange-600 font-medium">
                          • Game in progress
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWatchGame(room.roomCode)}
                    disabled={!isConnected}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Watch
                  </button>
                  <button
                    onClick={() => handleJoinGame(room.roomCode)}
                    disabled={
                      !isConnected ||
                      room.playerCount >= room.maxPlayers ||
                      room.gameStarted ||
                      room.isPrivate
                    }
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {room.isPrivate
                      ? "Private"
                      : room.gameStarted
                        ? "In Progress"
                        : room.playerCount >= room.maxPlayers
                          ? "Full"
                          : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Chat
        title="Lobby Chat"
        messages={lobbyChat}
        myName={playerName}
        onSend={lobbyRoom ? (text) => lobbyRoom.send('chat', { sender: playerName, text }) : undefined}
      />
    </div>
  );
}
