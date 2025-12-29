// Type definitions for Socket.IO events

export interface JoinGameData {
  playerName: string;
  roomId?: string;
}

export interface PlayerJoinedData {
  playerId: string;
  playerName: string;
  roomId: string;
}

export interface PlayerLeftData {
  playerId: string;
  playerName: string;
}

export interface PlayerReadyStatusData {
  playerId: string;
  playerName: string;
}

export interface SubmitAnswerData {
  answer: string;
}

export interface AnswerSubmittedData {
  playerId: string;
  playerName: string;
}

export interface ErrorData {
  message: string;
}

export interface GameStartData {
  roundNumber: number;
  prompt: string;
}

export interface RoundStartData {
  roundNumber: number;
  prompt: string;
  timeLimit: number;
}

export interface RevealAnswersData {
  answers: Array<{
    playerId: string;
    playerName: string;
    answer: string;
  }>;
}

export interface UpdateScoresData {
  scores: Record<string, number>;
}
