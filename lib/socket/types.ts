// Type definitions for Socket.IO events

export interface JoinGameData {
  playerName: string;
  roomId?: string;
  isPrivate?: boolean;
  playerId?: string; // Unique player ID (persists across tabs/sessions)
  tabId?: string; // Unique tab ID (unique per browser tab)
}

export interface PlayerJoinedData {
  playerId: string;
  playerName: string;
  roomId: string;
}

export interface PlayerReconnectedData {
  oldPlayerId: string;
  newPlayerId: string;
  playerName: string;
}

export interface PlayerLeftData {
  playerId: string;
  playerName: string;
}

export interface UpdatePlayerNameData {
  newName: string;
}

export interface PlayerNameUpdatedData {
  playerId: string;
  oldName: string;
  newName: string;
}

export interface HostChangedData {
  newHostId: string;
  newHostName: string;
}

export interface PlayerReadyStatusData {
  playerId: string;
  playerName: string;
}

export interface SubmitAnswerData {
  answer: string;
}

export interface SaveAnswerDraftData {
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
  totalRounds?: number;
  prompt?: string;
}

export interface RoundStartData {
  roundNumber: number;
  prompt: string;
  timeLimit: number;
}

export interface TimeRemainingData {
  timeRemaining: number; // milliseconds remaining in current round
  roundNumber: number;
}

export interface RevealAnswersData {
  answers: Array<{
    playerId: string;
    playerName: string;
    answer: string;
    count: number;
    points: number;
  }>;
}

export interface UpdateScoresData {
  scores: Record<string, number>;
}

export interface GameEndData {
  scores: Record<string, number>;
  players: Array<{
    playerId: string;
    playerName: string;
    score: number;
  }>;
  winner: {
    playerId: string;
    playerName: string;
    score: number;
  };
}

export interface RoomStateData {
  players: Array<{
    playerId: string;
    playerName: string;
    isReady: boolean;
  }>;
  roomId: string;
  hostId?: string; // The player ID of the room host
  previousWinners?: string[]; // Array of player IDs who won the previous game
}

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
  isGameStarted: boolean;
  isPrivate: boolean;
}

export interface RoomsListData {
  rooms: RoomInfo[];
}

export interface SendMessageData {
  message: string;
}

export interface NewMessageData {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}
