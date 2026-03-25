import { Schema, type } from "@colyseus/schema";

/**
 * Player schema representing a player in any game room
 * Tracks core player state that all games need
 */
export class Player extends Schema {
  @type("string") sessionId: string = "";
  @type("string") playerName: string = "";
  @type("boolean") isReady: boolean = false;
  @type("number") score: number = 0;
  @type("boolean") isConnected: boolean = true;
  @type("number") lastActivity: number = Date.now();
}
