export enum GameEvents {
  // Connection events
  JOIN_GAME = "join_game",
  PLAYER_JOINED = "player_joined",
  PLAYER_LEFT = "player_left",
  ROOM_STATE = "room_state",
  GET_ROOMS = "get_rooms",
  ROOMS_LIST = "rooms_list",

  // Game state events
  PLAYER_READY = "player_ready",
  PLAYER_READY_STATUS = "player_ready_status",
  GAME_START = "game_start",
  GAME_END = "game_end",

  // Round events
  ROUND_START = "round_start",
  ROUND_END = "round_end",
  NEXT_ROUND = "next_round",

  // Answer events
  SUBMIT_ANSWER = "submit_answer",
  ANSWER_SUBMITTED = "answer_submitted",
  SAVE_ANSWER_DRAFT = "save_answer_draft", // Save answer without marking as submitted
  REVEAL_ANSWERS = "reveal_answers",

  // Score events
  UPDATE_SCORES = "update_scores",

  // Error events
  ERROR = "error",
}
