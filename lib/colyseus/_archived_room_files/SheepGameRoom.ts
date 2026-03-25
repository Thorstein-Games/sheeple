import { Client } from "colyseus";
import { BaseGameRoom } from "./BaseGameRoom";
import { SheepGameState } from "../schema/SheepGameState";
import { PromptQueue } from "../../game/prompts";

/**
 * Normalizes an answer for comparison by:
 * - Converting to lowercase
 * - Removing all non-alphanumeric characters (punctuation, spaces, special chars)
 */
function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Calculates Levenshtein distance between two strings (edit distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Checks if two normalized answers should be considered a match
 */
function answersMatch(answer1: string, answer2: string): boolean {
  if (answer1 === answer2) return true;
  if (answer1.includes(answer2) || answer2.includes(answer1)) return true;
  if (levenshteinDistance(answer1, answer2) <= 1) return true;
  return false;
}

export class SheepGameRoom extends BaseGameRoom {
  declare state: SheepGameState;
  maxClients = 8;
  private promptQueue!: PromptQueue;
  private roundTimer?: NodeJS.Timeout;

  onCreate(options: any): void {
    super.onCreate(options);

    // Initialize state
    this.setState(new SheepGameState());
    this.state.roomId = this.roomId;
    this.state.isPrivate = options.isPrivate || false;
    this.state.maxRounds = options.maxRounds || 5;
    this.state.roundDuration = options.roundDuration || 30000;

    // Initialize prompt queue
    this.promptQueue = new PromptQueue();

    // Register message handlers
    this.onMessage("start_game", this.handleStartGame.bind(this));
    this.onMessage("submit_answer", this.handleSubmitAnswer.bind(this));
    this.onMessage("save_answer_draft", this.handleSaveAnswerDraft.bind(this));
    this.onMessage("next_round", this.handleNextRound.bind(this));
    this.onMessage(
      "get_time_remaining",
      this.handleGetTimeRemaining.bind(this),
    );
    this.onMessage(
      "update_player_name",
      this.handleUpdatePlayerName.bind(this),
    );

    console.log(
      `[SheepGame] Room ${this.roomId} created with ${this.state.maxRounds} rounds`,
    );
  }

  private handleStartGame(client: Client): void {
    // Validate host
    if (!this.isHost(client)) {
      client.send("error", { message: "Only host can start game" });
      return;
    }

    // Validate player count
    const connectedPlayers = Array.from(this.state.players.values()).filter(
      (p: any) => p.isConnected,
    );

    if (connectedPlayers.length < 2) {
      client.send("error", { message: "Need at least 2 players to start" });
      return;
    }

    // Validate all ready
    if (!this.checkAllReady()) {
      client.send("error", { message: "Not all players ready" });
      return;
    }

    // Start game
    this.state.gameStarted = true;
    this.state.gamePhase = "playing";
    this.state.currentRound = 0;

    // Reset scores
    this.state.players.forEach((player: any) => {
      player.score = 0;
    });

    this.broadcast("game_started", {
      totalRounds: this.state.maxRounds,
    });

    console.log(
      `[SheepGame] ${this.roomId} - Game started with ${connectedPlayers.length} players`,
    );

    // Start first round after a short delay
    this.clock.setTimeout(() => {
      this.startRound();
    }, 1000);
  }

  private startRound(): void {
    // Clear any existing timer
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }

    this.state.currentRound++;
    this.state.answers.clear();
    this.state.normalizedAnswers.clear();
    this.state.submittedPlayers.clear();
    this.state.roundStartTime = Date.now();
    this.state.waitingForNextRound = false;

    // Get next prompt
    this.state.currentPrompt = this.promptQueue.getNext();

    this.broadcast("round_started", {
      roundNumber: this.state.currentRound,
      prompt: this.state.currentPrompt,
      timeLimit: this.state.roundDuration,
    });

    console.log(
      `[SheepGame] Round ${this.state.currentRound} started in room ${this.roomId}: ${this.state.currentPrompt}`,
    );

    // Set timer to auto-reveal answers
    this.roundTimer = setTimeout(() => {
      setTimeout(() => {
        console.log(
          `[SheepGame] Time's up for round ${this.state.currentRound} in room ${this.roomId}`,
        );
        if (this.state.currentRound > 0 && !this.state.waitingForNextRound) {
          this.revealAnswers();
        }
      }, 500);
    }, this.state.roundDuration);
  }

  private handleSubmitAnswer(client: Client, data: { answer: string }): void {
    if (!this.state.gameStarted || this.state.gamePhase !== "playing") {
      client.send("error", { message: "Game not in progress" });
      return;
    }

    if (this.state.submittedPlayers.get(client.sessionId)) {
      client.send("error", { message: "Already submitted answer" });
      return;
    }

    const { answer } = data;
    if (!answer || typeof answer !== "string") {
      client.send("error", { message: "Invalid answer" });
      return;
    }

    const trimmed = answer.trim();
    if (trimmed.length === 0) {
      client.send("error", { message: "Answer cannot be empty" });
      return;
    }

    // Store answer
    this.state.answers.set(client.sessionId, trimmed);
    this.state.normalizedAnswers.set(
      client.sessionId,
      normalizeAnswer(trimmed),
    );
    this.state.submittedPlayers.set(client.sessionId, true);

    client.send("answer_submitted", { answer: trimmed });

    // Check if all players submitted
    const connectedPlayers = Array.from(this.state.players.values()).filter(
      (p: any) => p.isConnected,
    );

    const submittedCount = Array.from(
      this.state.submittedPlayers.values(),
    ).filter(Boolean).length;

    if (submittedCount === connectedPlayers.length) {
      // All players submitted
      if (this.roundTimer) {
        clearTimeout(this.roundTimer);
        this.roundTimer = undefined;
      }

      this.clock.setTimeout(() => {
        this.revealAnswers();
      }, 1000);
    }
  }

  private handleSaveAnswerDraft(
    client: Client,
    data: { answer: string },
  ): void {
    if (!this.state.gameStarted || this.state.gamePhase !== "playing") {
      return;
    }

    const { answer } = data;
    if (!answer || typeof answer !== "string") {
      return;
    }

    const trimmed = answer.trim();

    // Only save draft if not already submitted
    if (!this.state.submittedPlayers.get(client.sessionId)) {
      this.state.answers.set(client.sessionId, trimmed);
      this.state.normalizedAnswers.set(
        client.sessionId,
        normalizeAnswer(trimmed),
      );
    }
  }

  private revealAnswers(): void {
    // Clear timer
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }

    // Group answers by similarity
    const answerCounts = new Map<string, number>();
    const answerPlayers = new Map<string, string[]>();
    const answerGroups = new Map<string, string>();

    this.state.normalizedAnswers.forEach(
      (normalized: string, sessionId: string) => {
        let foundMatch = false;

        for (const [groupRep, players] of answerPlayers.entries()) {
          if (answersMatch(normalized, groupRep)) {
            players.push(sessionId);
            answerGroups.set(sessionId, groupRep);
            answerCounts.set(groupRep, (answerCounts.get(groupRep) || 0) + 1);
            foundMatch = true;
            break;
          }
        }

        if (!foundMatch) {
          answerPlayers.set(normalized, [sessionId]);
          answerGroups.set(sessionId, normalized);
          answerCounts.set(normalized, 1);
        }
      },
    );

    // Award points (capped at 3 per round)
    answerCounts.forEach((count, normalized) => {
      if (count > 1) {
        const players = answerPlayers.get(normalized)!;
        const pointsToAward = Math.min(count, 3);

        players.forEach((sessionId) => {
          const player = this.state.players.get(sessionId);
          if (player) {
            player.score += pointsToAward;
          }
        });
      }
    });

    // Prepare reveal data
    const answers: any[] = [];
    this.state.answers.forEach((answer: any, sessionId: string) => {
      const player = this.state.players.get(sessionId);
      const normalized = this.state.normalizedAnswers.get(sessionId) || "";
      const groupRep = answerGroups.get(sessionId) || normalized;
      const count = answerCounts.get(groupRep) || 0;

      answers.push({
        sessionId,
        playerName: player?.playerName || "Unknown",
        answer,
        count,
        points: count > 1 ? Math.min(count, 3) : 0,
      });
    });

    this.broadcast("answers_revealed", { answers });

    // Send updated scores
    this.clock.setTimeout(() => {
      const scores: Record<string, number> = {};
      this.state.players.forEach((player: any, sessionId: string) => {
        scores[sessionId] = player.score;
      });

      this.broadcast("scores_updated", { scores });

      // Set waiting flag
      this.state.waitingForNextRound = true;

      // Check if game is over
      if (this.state.currentRound >= this.state.maxRounds) {
        this.clock.setTimeout(() => {
          this.endGame();
        }, 3000);
      }
    }, 2000);
  }

  private endGame(): void {
    this.state.gamePhase = "ended";

    // Get final scores
    const players = Array.from(this.state.players.values())
      .map((p: any) => ({
        sessionId: p.sessionId,
        playerName: p.playerName,
        score: p.score,
      }))
      .sort((a, b) => b.score - a.score);

    // Track winners
    const highestScore = players[0]?.score || 0;
    const winners = players.filter((p) => p.score === highestScore);
    this.state.previousWinners = winners.map((w) => w.sessionId);

    this.broadcast("game_ended", {
      players,
      winner: players[0],
    });

    console.log(
      `[SheepGame] Game ended in room ${this.roomId}. Winner: ${players[0]?.playerName}`,
    );

    // Reset game state
    this.state.gameStarted = false;
    this.state.currentRound = 0;
    this.state.answers.clear();
    this.state.normalizedAnswers.clear();
    this.state.submittedPlayers.clear();

    this.state.players.forEach((player: any) => {
      player.isReady = false;
      player.score = 0;
    });
  }

  private handleNextRound(client: Client): void {
    if (!this.isHost(client)) {
      client.send("error", { message: "Only host can start next round" });
      return;
    }

    if (!this.state.waitingForNextRound) {
      client.send("error", { message: "Not waiting for next round" });
      return;
    }

    if (this.state.currentRound >= this.state.maxRounds) {
      client.send("error", { message: "Game already complete" });
      return;
    }

    this.startRound();
  }

  private handleGetTimeRemaining(client: Client): void {
    if (!this.state.roundStartTime || this.state.currentRound === 0) {
      client.send("time_remaining", { remaining: null });
      return;
    }

    const elapsed = Date.now() - this.state.roundStartTime;
    const remaining = Math.max(0, this.state.roundDuration - elapsed);

    client.send("time_remaining", { remaining });
  }

  private handleUpdatePlayerName(
    client: Client,
    data: { newName: string },
  ): void {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      client.send("error", { message: "Player not found" });
      return;
    }

    if (this.state.gameStarted) {
      client.send("error", { message: "Cannot change name during game" });
      return;
    }

    const { newName } = data;
    if (!newName || typeof newName !== "string") {
      client.send("error", { message: "Invalid name" });
      return;
    }

    const trimmed = newName.trim();
    if (trimmed.length === 0 || trimmed.length > 20) {
      client.send("error", { message: "Name must be 1-20 characters" });
      return;
    }

    const oldName = player.playerName;
    player.playerName = trimmed;

    this.broadcast("player_name_changed", {
      sessionId: client.sessionId,
      oldName,
      newName: trimmed,
    });
  }

  onDispose(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }

    super.onDispose();
  }
}
