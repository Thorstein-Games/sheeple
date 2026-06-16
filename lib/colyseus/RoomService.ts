// RoomService.ts
// Centralized helper for Colyseus room operations

import type { Client } from "colyseus.js";
import { SheepleState } from "./schema/SheepleState";
import type { RoomInfo } from "@/shared/schema/RoomMetadata";

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
  if (joinRoomId) {
    return await client.joinById<SheepleState>(joinRoomId, joinOptions);
  }
  return await client.joinOrCreate<SheepleState>("sheeple_game", joinOptions);
}
