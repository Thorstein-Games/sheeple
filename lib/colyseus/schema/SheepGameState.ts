import { Schema, type, MapSchema } from "@colyseus/schema";
import { BaseGameState } from "./BaseGameState";

export class SheepGameState extends BaseGameState {
  @type("string") currentPrompt: string = "";
  @type("number") currentRound: number = 0;
  @type("number") maxRounds: number = 5;
  @type("number") roundDuration: number = 60000;
  @type("number") roundStartTime: number = 0;
  @type("boolean") isPrivate: boolean = false;
  @type("boolean") waitingForNextRound: boolean = false;

  @type({ map: "string" }) answers = new MapSchema<string>();
  @type({ map: "string" }) normalizedAnswers = new MapSchema<string>();
  @type({ map: "boolean" }) submittedPlayers = new MapSchema<boolean>();

  previousWinners: string[] = [];
}
