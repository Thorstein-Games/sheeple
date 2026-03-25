import { Schema, type, MapSchema } from "@colyseus/schema";
import { BaseGameState } from "./BaseGameState";

export class SheepleState extends BaseGameState {
  @type("string") currentPrompt: string = "";
  @type("number") currentRound: number = 0;
  @type("number") totalRounds: number = 5;
  @type("number") roundDuration: number = 60000;
  @type("number") roundEndTime: number = 0;
  @type("string") roundPhase: "waiting" | "prompt" | "answers" | "scoring" | "results" = "waiting";

  @type({ map: "string" }) answers = new MapSchema<string>();
  @type({ map: "string" }) normalizedAnswers = new MapSchema<string>();
  @type({ map: "number" }) roundPoints = new MapSchema<number>();
}
