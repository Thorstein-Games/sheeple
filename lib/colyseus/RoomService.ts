// RoomService.ts
// Centralized helper for Colyseus room operations

import type { Client, Room } from "colyseus.js";
import { SheepleState } from "./schema/SheepleState";
import type { RoomInfo } from "@/shared/schema/RoomMetadata";

/**
 * room.state is not guaranteed to be populated yet right after join()/joinOrCreate()
 * resolves — the JOIN_ROOM handshake arrives before the first full state snapshot.
 */
export function getRoomCode(room: Room<SheepleState>): Promise<string> {
  if (room.state?.roomCode) {
    return Promise.resolve(room.state.roomCode);
  }
  return new Promise((resolve) => {
    room.onStateChange.once((state: SheepleState) => resolve(state.roomCode));
  });
}

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
    roomCode?: string;
    isPrivate?: boolean;
    playerId?: string;
    tabId?: string;
    forcePublic?: boolean;
  } = {},
) {
  const { roomCode, isPrivate, playerId, tabId, forcePublic } = options;
  const joinRoomCode = roomCode?.trim().toUpperCase() || undefined;
  const joinOptions = {
    playerName,
    isPrivate: forcePublic ? false : joinRoomCode ? false : isPrivate,
    playerId,
    tabId,
  };
  if (joinRoomCode) {
    return await client.join<SheepleState>("sheeple_game", {
      ...joinOptions,
      roomCode: joinRoomCode,
    });
  }
  return await client.joinOrCreate<SheepleState>("sheeple_game", joinOptions);
}
