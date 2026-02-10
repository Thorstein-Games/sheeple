import { Server as SocketIOServer } from "socket.io";
import { GameEvents } from "../socket/events";
import { MAX_PLAYERS } from "../constants";
import { PromptQueue } from "./prompts";
import { handleRoundStart as devModeHandleRoundStart } from "./devMode";

export interface Player {
  playerId: string;
  playerName: string;
  isReady: boolean;
  answer?: string;
  score: number;
  uniquePlayerId?: string; // Unique player ID (localStorage)
  tabId?: string; // Unique tab ID (sessionStorage)
}

export interface GameRoom {
  roomId: string;
  players: Map<string, Player>;
  hostId: string; // The player ID of the room host
  isGameStarted: boolean;
  isPrivate: boolean;
  currentRound: number;
  currentPrompt: string;
  answers: Map<string, string>; // playerId -> normalized answer for comparison
  originalAnswers: Map<string, string>; // playerId -> original answer for display
  submittedPlayers: Set<string>; // Players who officially submitted (not just drafts)
  scores: Map<string, number>;
  totalRounds: number;
  previousWinners: Set<string>;
  promptQueue: PromptQueue;
  waitingForNextRound: boolean; // Track if we're waiting for players to continue
  roundTimer?: NodeJS.Timeout; // Timer for current round
  roundStartTime?: number; // Timestamp when round started
}

/**
 * Normalizes an answer for comparison by:
 * - Converting to lowercase
 * - Removing all non-alphanumeric characters (punctuation, spaces, special chars)
 * This allows flexible matching (e.g., "don't" matches "dont", "New York" matches "newyork")
 */
function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().replace(/[^a-z0-9]/g, ""); // Keep only letters and numbers
}

/**
 * Calculates Levenshtein distance between two strings (edit distance)
 * Used to determine how many single-character edits are needed to change one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Checks if two normalized answers should be considered a match.
 * Matching criteria:
 * 1. Exact match
 * 2. One answer is fully contained within the other (substring match)
 * 3. Levenshtein distance of 1 (one character difference)
 */
function answersMatch(answer1: string, answer2: string): boolean {
  if (answer1 === answer2) return true;

  // Check if one answer is a substring of the other
  if (answer1.includes(answer2) || answer2.includes(answer1)) {
    return true;
  }

  // Check if answers are only one character apart (for similar length answers)
  if (levenshteinDistance(answer1, answer2) <= 1) {
    return true;
  }

  return false;
}

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  createRoom(roomId: string, isPrivate: boolean = false): GameRoom {
    const room: GameRoom = {
      roomId,
      players: new Map(),
      hostId: "", // Will be set when first player joins
      isGameStarted: false,
      isPrivate,
      currentRound: 0,
      currentPrompt: "",
      answers: new Map(),
      originalAnswers: new Map(),
      submittedPlayers: new Set(),
      scores: new Map(),
      totalRounds: 5,
      previousWinners: new Set(),
      promptQueue: new PromptQueue(),
      waitingForNextRound: false,
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  checkDuplicateTab(
    roomId: string,
    uniquePlayerId: string,
    tabId: string,
  ): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    // Check if a player with the same uniquePlayerId but different tabId is already in the room
    const existingPlayer = Array.from(room.players.values()).find(
      (p) => p.uniquePlayerId === uniquePlayerId && p.tabId !== tabId,
    );

    return !!existingPlayer;
  }

  addPlayer(
    roomId: string,
    playerId: string,
    playerName: string,
    isPrivate: boolean = false,
    uniquePlayerId?: string,
    tabId?: string,
  ): { added: boolean; isReconnect: boolean; oldPlayerId?: string } {
    let room = this.getRoom(roomId);
    if (!room) {
      room = this.createRoom(roomId, isPrivate);
    }

    // Check if player already exists by socket ID
    if (room.players.has(playerId)) {
      console.log(`Player ${playerId} already in room ${roomId}`);
      return { added: false, isReconnect: false };
    }

    // Check if a player with the same name already exists (reconnection scenario)
    // But only if they have the same uniquePlayerId (same browser) or no uniquePlayerId tracking
    const existingPlayer = Array.from(room.players.values()).find(
      (p) =>
        p.playerName === playerName &&
        (!uniquePlayerId ||
          !p.uniquePlayerId ||
          p.uniquePlayerId === uniquePlayerId),
    );

    if (existingPlayer) {
      console.log(
        `Player "${playerName}" reconnecting to room ${roomId}. Updating socket ID from ${existingPlayer.playerId} to ${playerId}`,
      );
      const oldPlayerId = existingPlayer.playerId;

      // Remove old player entry
      room.players.delete(oldPlayerId);
      const oldScore = room.scores.get(oldPlayerId) || 0;
      room.scores.delete(oldPlayerId);

      // Transfer answer data if it exists
      const oldAnswer = room.answers.get(oldPlayerId);
      const oldOriginalAnswer = room.originalAnswers.get(oldPlayerId);
      const wasSubmitted = room.submittedPlayers.has(oldPlayerId);

      if (oldAnswer) {
        room.answers.delete(oldPlayerId);
        room.answers.set(playerId, oldAnswer);
      }
      if (oldOriginalAnswer) {
        room.originalAnswers.delete(oldPlayerId);
        room.originalAnswers.set(playerId, oldOriginalAnswer);
      }
      if (wasSubmitted) {
        room.submittedPlayers.delete(oldPlayerId);
        room.submittedPlayers.add(playerId);
      }

      // Add player with new socket ID but preserve their data
      const player: Player = {
        playerId,
        playerName,
        isReady: existingPlayer.isReady,
        score: existingPlayer.score,
        answer: existingPlayer.answer,
        uniquePlayerId,
        tabId,
      };

      room.players.set(playerId, player);
      room.scores.set(playerId, oldScore);
      return { added: true, isReconnect: true, oldPlayerId };
    }

    // New player joining
    const player: Player = {
      playerId,
      playerName,
      isReady: false,
      score: 0,
      uniquePlayerId,
      tabId,
    };

    room.players.set(playerId, player);
    room.scores.set(playerId, 0);

    // Set as host if they're the first player
    if (room.players.size === 1) {
      room.hostId = playerId;
      console.log(
        `Player ${playerName} (${playerId}) is now the host of room ${roomId}`,
      );
    }

    return { added: true, isReconnect: false };
  }

  removePlayer(roomId: string, playerId: string): { newHostId?: string } {
    const room = this.getRoom(roomId);
    if (!room) return {};

    const wasHost = room.hostId === playerId;

    room.players.delete(playerId);
    room.scores.delete(playerId);
    room.answers.delete(playerId);
    room.originalAnswers.delete(playerId);

    // Clean up empty rooms
    if (room.players.size === 0) {
      // Clear any active round timer
      if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = undefined;
      }
      this.rooms.delete(roomId);
      return {};
    }

    // Reassign host if the host left
    if (wasHost) {
      const newHost = Array.from(room.players.keys())[0];
      room.hostId = newHost;
      const newHostPlayer = room.players.get(newHost);
      console.log(
        `Host left room ${roomId}. New host: ${newHostPlayer?.playerName} (${newHost})`,
      );
      return { newHostId: newHost };
    }

    return {};
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.isReady = ready;
    return true;
  }

  getPlayer(roomId: string, playerId: string): Player | undefined {
    const room = this.getRoom(roomId);
    if (!room) return undefined;

    return room.players.get(playerId);
  }

  updatePlayerName(roomId: string, playerId: string, newName: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.playerName = newName;
    return true;
  }

  areAllPlayersReady(roomId: string): boolean {
    const room = this.getRoom(roomId);

    if (!room) return false;

    return Array.from(room.players.values()).every((player) => player.isReady);
  }

  startGame(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.isGameStarted = true;
    room.currentRound = 0;
    room.scores.clear();
    room.players.forEach((player) => {
      player.score = 0;
      room.scores.set(player.playerId, 0);
    });

    this.io.to(roomId).emit(GameEvents.GAME_START, {
      roundNumber: 1,
      totalRounds: room.totalRounds,
    });

    // Broadcast updated rooms list to all connected clients (for lobby)
    const rooms = this.getAllRooms();
    this.io.emit(GameEvents.ROOMS_LIST, { rooms });

    // Start first round after a short delay
    setTimeout(() => {
      this.startRound(roomId);
    }, 1000);
  }

  startRound(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Clear any existing timer
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
    }

    room.currentRound++;
    room.answers.clear();
    room.originalAnswers.clear();
    room.submittedPlayers.clear();
    room.roundStartTime = Date.now();

    // Get next prompt from the queue (no repeats until all prompts used)
    room.currentPrompt = room.promptQueue.getNext();

    const timeLimit = 30000; // 30 seconds

    this.io.to(roomId).emit(GameEvents.ROUND_START, {
      roundNumber: room.currentRound,
      prompt: room.currentPrompt,
      timeLimit: timeLimit,
    });

    console.log(
      `Round ${room.currentRound} started in room ${roomId}: ${room.currentPrompt}`,
    );

    // Notify dev mode to auto-submit fake player answers
    devModeHandleRoundStart(roomId, room.currentPrompt, room.currentRound);

    // Set server-side timer to auto-reveal answers after time limit
    room.roundTimer = setTimeout(() => {
      // Small delay to give players a little buffer
      setTimeout(() => {
        console.log(
          `Time's up for round ${room.currentRound} in room ${roomId}`,
        );
        // Only reveal if we haven't already (e.g., all players submitted early)
        if (room.currentRound > 0 && !room.waitingForNextRound) {
          this.revealAnswers(roomId);
        }
      }, 500);
    }, timeLimit);
  }

  submitAnswer(roomId: string, playerId: string, answer: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    // Store both normalized answer (for comparison) and original (for display)
    room.answers.set(playerId, normalizeAnswer(answer));
    room.originalAnswers.set(playerId, answer.trim());

    // Mark player as officially submitted
    room.submittedPlayers.add(playerId);

    // Check if all players have submitted (not just saved drafts)
    if (room.submittedPlayers.size === room.players.size) {
      // All players submitted, clear timer and proceed to reveal
      if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = undefined;
      }
      setTimeout(() => {
        this.revealAnswers(roomId);
      }, 1000);
    }

    return true;
  }

  saveAnswerDraft(roomId: string, playerId: string, answer: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    // Only save draft if player hasn't officially submitted yet
    // We check this by seeing if we've already broadcasted their submission
    // For now, we'll always update the draft - the submitAnswer will mark it as final

    // Store draft answer (will be used if time runs out or they submit)
    room.answers.set(playerId, normalizeAnswer(answer));
    room.originalAnswers.set(playerId, answer.trim());

    // Note: We don't check if all players answered or trigger reveal
    // This is just a draft save, not a submission
    return true;
  }

  revealAnswers(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Clear the round timer if it exists
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = undefined;
    }

    // Only count answers from players who actually submitted
    // Players without answers are excluded from scoring
    const answerCounts = new Map<string, number>();
    const answerPlayers = new Map<string, string[]>();
    const answerGroups = new Map<string, string>(); // Maps playerId to their group representative

    // Group answers based on flexible matching
    // Each answer is compared to existing groups, and either joins a group or creates a new one
    room.answers.forEach((normalizedAnswer, playerId) => {
      let foundMatch = false;

      // Try to find an existing group that this answer matches with
      for (const [groupRep, players] of answerPlayers.entries()) {
        if (answersMatch(normalizedAnswer, groupRep)) {
          // This answer matches an existing group
          players.push(playerId);
          answerGroups.set(playerId, groupRep);
          answerCounts.set(groupRep, (answerCounts.get(groupRep) || 0) + 1);
          foundMatch = true;
          break;
        }
      }

      // If no matching group found, create a new one with this answer as the representative
      if (!foundMatch) {
        answerPlayers.set(normalizedAnswer, [playerId]);
        answerGroups.set(playerId, normalizedAnswer);
        answerCounts.set(normalizedAnswer, 1);
      }
    });

    // Award points: players get points equal to how many others gave the same answer
    // Only players who submitted answers can earn points
    // Maximum points per round is capped at 3
    answerCounts.forEach((count, normalizedAnswer) => {
      if (count > 1) {
        // Only award points if multiple people gave the same answer
        const players = answerPlayers.get(normalizedAnswer)!;
        const pointsToAward = Math.min(count, 3); // Cap points at 3
        players.forEach((playerId) => {
          const currentScore = room.scores.get(playerId) || 0;
          room.scores.set(playerId, currentScore + pointsToAward);
        });
      }
    });

    // Emit reveal answers using original answers for display
    // Only include players who submitted answers
    const answers = Array.from(room.answers.entries()).map(
      ([playerId, normalizedAnswer]) => {
        const player = room.players.get(playerId);
        const originalAnswer = room.originalAnswers.get(playerId) || "";
        const groupRep = answerGroups.get(playerId) || normalizedAnswer;
        const count = answerCounts.get(groupRep) || 0;
        return {
          playerId,
          playerName: player?.playerName || "Unknown",
          answer: originalAnswer, // Display the original answer
          count,
          points: count > 1 ? Math.min(count, 3) : 0, // Cap displayed points at 3
        };
      },
    );

    this.io.to(roomId).emit(GameEvents.REVEAL_ANSWERS, {
      answers,
    });

    // Emit updated scores
    const scores: Record<string, number> = {};
    room.scores.forEach((score, playerId) => {
      scores[playerId] = score;
    });

    setTimeout(() => {
      this.io.to(roomId).emit(GameEvents.UPDATE_SCORES, {
        scores,
      });

      // Set flag to wait for players to click "Next Round"
      room.waitingForNextRound = true;

      // Check if this is the last round
      if (room.currentRound >= room.totalRounds) {
        // End game after a delay to let players see final scores
        setTimeout(() => {
          this.endGame(roomId);
        }, 3000);
      }
      // For other rounds, wait for player to click "Next Round" button
    }, 2000);
  }

  endGame(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Clear any active round timer
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = undefined;
    }

    const scores: Record<string, number> = {};
    const players: Array<{
      playerId: string;
      playerName: string;
      score: number;
    }> = [];

    room.scores.forEach((score, playerId) => {
      const player = room.players.get(playerId);
      scores[playerId] = score;
      if (player) {
        players.push({
          playerId,
          playerName: player.playerName,
          score,
        });
      }
    });

    // Track winner(s) for next game - find all players with highest score
    players.sort((a, b) => b.score - a.score);
    const highestScore = players[0]?.score || 0;
    const winners = players.filter((p) => p.score === highestScore);
    room.previousWinners.clear();
    winners.forEach((winner) => {
      room.previousWinners.add(winner.playerId);
    });

    this.io.to(roomId).emit(GameEvents.GAME_END, {
      scores,
      players,
      winner: players[0],
    });

    console.log(
      `Game ended in room ${roomId}. Winner: ${players[0]?.playerName}`,
    );

    // Reset game state
    room.isGameStarted = false;
    room.currentRound = 0;
    room.answers.clear();
    room.originalAnswers.clear();
    room.scores.clear();
    room.players.forEach((player) => {
      player.isReady = false;
      player.score = 0;
    });

    // Broadcast updated room state to all players in the room
    this.io.to(roomId).emit(GameEvents.ROOM_STATE, {
      roomId: room.roomId,
      hostId: room.hostId,
      players: Array.from(room.players.values()).map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        isReady: p.isReady,
      })),
      previousWinners: Array.from(room.previousWinners),
    });

    // Broadcast updated rooms list to all connected clients (for lobby)
    const rooms = this.getAllRooms();
    this.io.emit(GameEvents.ROOMS_LIST, { rooms });
  }

  getPlayerCount(roomId: string): number {
    const room = this.getRoom(roomId);
    return room ? room.players.size : 0;
  }

  getPlayers(roomId: string): Player[] {
    const room = this.getRoom(roomId);
    return room ? Array.from(room.players.values()) : [];
  }

  getRoomState(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    return {
      roomId: room.roomId,
      playerCount: room.players.size,
      hostId: room.hostId,
      isGameStarted: room.isGameStarted,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      players: Array.from(room.players.values()),
      previousWinners: Array.from(room.previousWinners),
    };
  }

  getAllRooms() {
    return Array.from(this.rooms.values())
      .filter((room) => room.roomId !== "lobby") // Exclude lobby room from list
      .map((room) => ({
        roomId: room.roomId,
        playerCount: room.players.size,
        maxPlayers: MAX_PLAYERS,
        isGameStarted: room.isGameStarted,
        isPrivate: room.isPrivate,
      }));
  }

  startNextRound(roomId: string): boolean {
    const room = this.getRoom(roomId);
    if (!room || !room.waitingForNextRound) return false;

    room.waitingForNextRound = false;
    this.startRound(roomId);
    return true;
  }

  getTimeRemaining(roomId: string): number | null {
    const room = this.getRoom(roomId);
    if (!room || !room.roundStartTime || room.currentRound === 0) {
      return null;
    }

    const timeLimit = 30000; // 30 seconds
    const elapsed = Date.now() - room.roundStartTime;
    const remaining = Math.max(0, timeLimit - elapsed);

    return remaining;
  }
}
