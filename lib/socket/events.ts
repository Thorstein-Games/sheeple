export enum GameEvents {
  // Connection events
  JOIN_GAME = "join_game",
  PLAYER_JOINED = "player_joined",
  PLAYER_LEFT = "player_left",

  // Game state events
  PLAYER_READY = "player_ready",
  PLAYER_READY_STATUS = "player_ready_status",
  GAME_START = "game_start",
  GAME_END = "game_end",

  // Round events
  ROUND_START = "round_start",
  ROUND_END = "round_end",

  // Answer events
  SUBMIT_ANSWER = "submit_answer",
  ANSWER_SUBMITTED = "answer_submitted",
  REVEAL_ANSWERS = "reveal_answers",

  // Voting events
  SUBMIT_VOTE = "submit_vote",
  VOTE_SUBMITTED = "vote_submitted",
  VOTING_COMPLETE = "voting_complete",

  // Score events
  UPDATE_SCORES = "update_scores",

  // Error events
  ERROR = "error",
}
