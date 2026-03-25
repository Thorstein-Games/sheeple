import { Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") sessionId: string = "";
  @type("string") playerName: string = "";
  @type("string") uniquePlayerId: string = "";
  @type("string") tabId: string = "";
  @type("boolean") isConnected: boolean = true;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isHost: boolean = false;
  @type("number") score: number = 0;
  @type("number") joinedAt: number = 0;
  @type("number") lastSeen: number = 0;
}
