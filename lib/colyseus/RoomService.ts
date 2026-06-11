// RoomService.ts
// Centralized helper for Colyseus room operations

import type { Client } from "colyseus.js";
import type { ClientWithHTTPAPI } from "./types";
import { SheepleState } from "./schema/SheepleState";
import type { RoomAvailable, RoomInfo } from "@/shared/schema/RoomMetadata";
import { toRoomInfo } from "@/shared/schema/RoomMetadata";

// Re-export for convenience
export type { RoomInfo, RoomAvailable };

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

export async function listRooms(client: ClientWithHTTPAPI): Promise<RoomInfo[]> {
  // Use HTTP client to fetch rooms from matchmaker
  try {
    const response = await client.getAvailableRooms("sheeple_game");
    return response.map((room) => toRoomInfo(room));
  } catch (error) {
    console.error("Error listing rooms:", error);
    return [];
  }
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
