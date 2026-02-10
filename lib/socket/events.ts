export enum GameEvents {
  // Connection events
  JOIN_GAME = "join_game",
  PLAYER_JOINED = "player_joined",
  PLAYER_RECONNECTED = "player_reconnected",
  PLAYER_LEFT = "player_left",
  HOST_CHANGED = "host_changed",
  UPDATE_PLAYER_NAME = "update_player_name",
  PLAYER_NAME_UPDATED = "player_name_updated",
  ROOM_STATE = "room_state",
  GET_ROOMS = "get_rooms",
  ROOMS_LIST = "rooms_list",

  // Game state events
  PLAYER_READY = "player_ready",
  PLAYER_READY_STATUS = "player_ready_status",
  START_GAME = "start_game",
  GAME_START = "game_start",
  GAME_END = "game_end",

  // Round events
  ROUND_START = "round_start",
  ROUND_END = "round_end",
  NEXT_ROUND = "next_round",
  GET_TIME_REMAINING = "get_time_remaining",
  TIME_REMAINING = "time_remaining",

  // Answer events
  SUBMIT_ANSWER = "submit_answer",
  ANSWER_SUBMITTED = "answer_submitted",
  SAVE_ANSWER_DRAFT = "save_answer_draft", // Save answer without marking as submitted
  REVEAL_ANSWERS = "reveal_answers",

  // Score events
  UPDATE_SCORES = "update_scores",

  // Chat events
  SEND_MESSAGE = "send_message",
  NEW_MESSAGE = "new_message",

  // Dev mode events
  ADD_FAKE_PLAYER = "add_fake_player",

  // Error events
  ERROR = "error",
}
