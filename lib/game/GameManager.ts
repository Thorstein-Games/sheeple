import { Server as SocketIOServer } from "socket.io";
import { GameEvents } from "../socket/events";
import { MAX_PLAYERS } from "../constants";

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
  answers: Map<string, string>;
  scores: Map<string, number>;
  totalRounds: number;
  previousWinners: Set<string>;
}

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private io: SocketIOServer;

  // Sample prompts for Sheeple game
  private prompts = [
    "Name a fruit",
    "Name a color",
    "Name a pizza topping",
    "Name a day of the week",
    "Name a country",
    "Name an animal",
    "Name a sport",
    "Name a movie genre",
    "Name a breakfast food",
    "Name a school subject",
    "Name a musical instrument",
    "Name a type of weather",
    "Name a beverage",
    "Name a car brand",
    "Name a city",
    "Name a video game",
    "Name a dessert",
    "Name a vegetable",
    "Name a season",
    "Name a superhero",
  ];

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
      scores: new Map(),
      totalRounds: 5,
      previousWinners: new Set(),
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

    // Pick a random prompt
    const promptIndex = Math.floor(Math.random() * this.prompts.length);
    room.currentPrompt = this.prompts[promptIndex];

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

    room.answers.set(playerId, answer.toLowerCase().trim());

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

    // Calculate scores
    const answerCounts = new Map<string, number>();
    const answerPlayers = new Map<string, string[]>();

    // Count answer frequencies
    room.answers.forEach((answer, playerId) => {
      answerCounts.set(answer, (answerCounts.get(answer) || 0) + 1);
      if (!answerPlayers.has(answer)) {
        answerPlayers.set(answer, []);
      }
      answerPlayers.get(answer)!.push(playerId);
    });

    // Award points: players get points equal to how many others gave the same answer
    answerCounts.forEach((count, answer) => {
      if (count > 1) {
        // Only award points if multiple people gave the same answer
        const players = answerPlayers.get(answer)!;
        players.forEach((playerId) => {
          const currentScore = room.scores.get(playerId) || 0;
          room.scores.set(playerId, currentScore + count);
        });
      }
    });

    // Emit reveal answers
    const answers = Array.from(room.answers.entries()).map(
      ([playerId, answer]) => {
        const player = room.players.get(playerId);
        const count = answerCounts.get(answer) || 0;
        return {
          playerId,
          playerName: player?.playerName || "Unknown",
          answer,
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
