import { Schema, type, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";

/**
 * Base game state that all game rooms extend
 * Contains common state like players, host, and game phase
 */
export class BaseGameState extends Schema {
  @type("string") roomId: string = "";
  @type("string") roomCode: string = "";
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") hostId: string = "";
  @type("boolean") gameStarted: boolean = false;
  @type("string") gamePhase: "lobby" | "playing" | "ended" = "lobby";
  @type("number") createdAt: number = Date.now();
}
