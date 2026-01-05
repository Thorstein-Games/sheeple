import { Server as SocketIOServer } from "socket.io";
import { GameEvents } from "../socket/events";
import { MAX_PLAYERS } from "../constants";
import { PromptQueue } from "./prompts";

export interface Player {
  playerId: string;
  playerName: string;
  isReady: boolean;
  answer?: string;
  score: number;
}

export interface GameRoom {
  roomId: string;
  players: Map<string, Player>;
  isGameStarted: boolean;
  isPrivate: boolean;
  currentRound: number;
  currentPrompt: string;
  answers: Map<string, string>; // playerId -> normalized answer for comparison
  originalAnswers: Map<string, string>; // playerId -> original answer for display
  scores: Map<string, number>;
  totalRounds: number;
  previousWinners: Set<string>;
  promptQueue: PromptQueue;
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
      isGameStarted: false,
      isPrivate,
      currentRound: 0,
      currentPrompt: "",
      answers: new Map(),
      originalAnswers: new Map(),
      scores: new Map(),
      totalRounds: 5,
      previousWinners: new Set(),
      promptQueue: new PromptQueue(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  addPlayer(
    roomId: string,
    playerId: string,
    playerName: string,
    isPrivate: boolean = false
  ): boolean {
    let room = this.getRoom(roomId);
    if (!room) {
      room = this.createRoom(roomId, isPrivate);
    }

    // Check if player already exists
    if (room.players.has(playerId)) {
      console.log(`Player ${playerId} already in room ${roomId}`);
      return false;
    }

    const player: Player = {
      playerId,
      playerName,
      isReady: false,
      score: 0,
    };

    room.players.set(playerId, player);
    room.scores.set(playerId, 0);
    return true;
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.players.delete(playerId);
    room.scores.delete(playerId);
    room.answers.delete(playerId);
    room.originalAnswers.delete(playerId);

    // Clean up empty rooms
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.isReady = ready;
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

    // Start first round after a short delay
    setTimeout(() => {
      this.startRound(roomId);
    }, 1000);
  }

  startRound(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.currentRound++;
    room.answers.clear();
    room.originalAnswers.clear();

    // Get next prompt from the queue (no repeats until all prompts used)
    room.currentPrompt = room.promptQueue.getNext();

    this.io.to(roomId).emit(GameEvents.ROUND_START, {
      roundNumber: room.currentRound,
      prompt: room.currentPrompt,
      timeLimit: 30000, // 30 seconds
    });

    console.log(
      `Round ${room.currentRound} started in room ${roomId}: ${room.currentPrompt}`
    );
  }

  submitAnswer(roomId: string, playerId: string, answer: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    // Store both normalized answer (for comparison) and original (for display)
    room.answers.set(playerId, normalizeAnswer(answer));
    room.originalAnswers.set(playerId, answer.trim());

    // Check if all players have answered
    if (room.answers.size === room.players.size) {
      // All players answered, proceed to reveal
      setTimeout(() => {
        this.revealAnswers(roomId);
      }, 1000);
    }

    return true;
  }

  revealAnswers(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Calculate scores using normalized answers for comparison
    const answerCounts = new Map<string, number>();
    const answerPlayers = new Map<string, string[]>();

    // Count answer frequencies based on normalized answers
    room.answers.forEach((normalizedAnswer, playerId) => {
      answerCounts.set(
        normalizedAnswer,
        (answerCounts.get(normalizedAnswer) || 0) + 1
      );
      if (!answerPlayers.has(normalizedAnswer)) {
        answerPlayers.set(normalizedAnswer, []);
      }
      answerPlayers.get(normalizedAnswer)!.push(playerId);
    });

    // Award points: players get points equal to how many others gave the same answer
    answerCounts.forEach((count, normalizedAnswer) => {
      if (count > 1) {
        // Only award points if multiple people gave the same answer
        const players = answerPlayers.get(normalizedAnswer)!;
        players.forEach((playerId) => {
          const currentScore = room.scores.get(playerId) || 0;
          room.scores.set(playerId, currentScore + count);
        });
      }
    });

    // Emit reveal answers using original answers for display
    const answers = Array.from(room.answers.entries()).map(
      ([playerId, normalizedAnswer]) => {
        const player = room.players.get(playerId);
        const originalAnswer = room.originalAnswers.get(playerId) || "";
        const count = answerCounts.get(normalizedAnswer) || 0;
        return {
          playerId,
          playerName: player?.playerName || "Unknown",
          answer: originalAnswer, // Display the original answer
          count,
          points: count > 1 ? count : 0,
        };
      }
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

      // Check if game should end or start next round
      if (room.currentRound >= room.totalRounds) {
        setTimeout(() => {
          this.endGame(roomId);
        }, 5000);
      } else {
        setTimeout(() => {
          this.startRound(roomId);
        }, 5000);
      }
    }, 2000);
  }

  endGame(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

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
      `Game ended in room ${roomId}. Winner: ${players[0]?.playerName}`
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
      isGameStarted: room.isGameStarted,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      players: Array.from(room.players.values()),
      previousWinners: Array.from(room.previousWinners),
    };
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      roomId: room.roomId,
      playerCount: room.players.size,
      maxPlayers: MAX_PLAYERS,
      isGameStarted: room.isGameStarted,
      isPrivate: room.isPrivate,
    }));
  }
}
