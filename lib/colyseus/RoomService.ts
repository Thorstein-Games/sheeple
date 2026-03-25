// RoomService.ts
// Centralized helper for Colyseus room operations

import type { Client } from "colyseus.js";
import type { RoomInfo } from "@/lib/socket/types";
import { SheepleState } from "./schema/SheepleState";

export async function joinLobby(
  client: Client,
  playerName: string,
  playerId?: string,
  tabId?: string,
) {
  const room = await client.joinOrCreate("lobby", {
    playerName,
    isPrivate: true,
    playerId,
    tabId,
  });
  return room;
}

export async function listRooms(client: Client): Promise<RoomInfo[]> {
  const response = await client.http.get<RoomInfo[]>("matchmake/rooms/sheeple_game");
  return response.data;
}

export async function joinOrCreateGameRoom(
  client: Client,
  playerName: string,
  options: {
    roomId?: string;
    isPrivate?: boolean;
    playerId?: string;
    tabId?: string;
    forcePublic?: boolean;
  } = {},
) {
  const { roomId, isPrivate, playerId, tabId, forcePublic } = options;
  const joinRoomId = roomId?.trim() || undefined;
  const joinOptions = {
    playerName,
    isPrivate: forcePublic ? false : joinRoomId ? false : isPrivate,
    playerId,
    tabId,
  };
  return await client.joinOrCreate<SheepleState>(joinRoomId || "sheeple_game", joinOptions);
}
