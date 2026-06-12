// types.ts
// Shared Colyseus-related type extensions

import type { Client } from "colyseus.js";
import type { RoomAvailable } from "@/shared/schema/RoomMetadata";

/**
 * Extended Colyseus client including HTTP matchmaker methods
 * Exported from a central file so other modules can reuse it.
 */
export interface ClientWithHTTPAPI extends Client {
  getAvailableRooms?(roomName: string): Promise<RoomAvailable[]>;
  /**
   * Fetch a single room's info from the matchmaker by its roomId.
   * Returns `undefined` when the room isn't found.
   */
  getRoomById?(roomId: string): Promise<RoomAvailable | undefined>;
}
