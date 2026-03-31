/**
 * Room metadata types for Colyseus matchmaker API
 * 
 * This file RE-EXPORTS types from their canonical sources and provides helper utilities.
 * It does NOT redefine types - it imports them from colyseus.js and server schemas.
 * 
 * Used by:
 * - Client: Type checking matchmaker API responses (getAvailableRooms)
 * - Server: Documentation of metadata structure (but server doesn't import this)
 */

// Import Colyseus's actual RoomAvailable type
import type { RoomAvailable as ColyseusRoomAvailable } from "colyseus.js";

/**
 * Metadata structure that the server sets via room.setMetadata()
 * 
 * This defines the shape of the metadata object. The server sets these fields
 * but doesn't need to import this type (setMetadata is untyped).
 */
export interface RoomMetadata {
  /**
   * Unique room ID assigned by Colyseus
   */
  roomId: string;
  
  /**
   * Human-readable room code (e.g., "ABCD12")
   */
  roomCode: string;
  
  /**
   * Type of game room (e.g., "sheeple_game", "lobby")
   */
  gameType: string;
  
  /**
   * Maximum number of clients allowed in this room
   */
  maxClients: number;
  
  /**
   * Whether the game has started
   * Used for lobby filtering to hide in-progress games
   */
  gameStarted: boolean;
  
  /**
   * Timestamp when the room was created
   */
  createdAt: number;
  
  /**
   * Name of the current host player (if any)
   */
  hostName?: string;
}

/**
 * Room info as returned by the matchmaker API
 * Uses Colyseus's actual RoomAvailable type with our metadata
 */
export type RoomAvailable = ColyseusRoomAvailable<RoomMetadata>;

/**
 * Simplified room info for UI display
 * Flattens RoomAvailable for easier consumption
 */
export interface RoomInfo {
  roomId: string;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  gameStarted: boolean;
  isPrivate: boolean;
  hostName?: string;
  gameType: string;
}

/**
 * Helper to convert RoomAvailable to RoomInfo
 */
export function toRoomInfo(room: RoomAvailable): RoomInfo {
  return {
    roomId: room.roomId,
    roomCode: room.metadata?.roomCode || "",
    playerCount: room.clients,
    maxPlayers: room.maxClients,
    gameStarted: room.metadata?.gameStarted || false,
    isPrivate: false, // Colyseus doesn't expose private flag in metadata
    hostName: room.metadata?.hostName,
    gameType: room.metadata?.gameType || room.name,
  };
}

