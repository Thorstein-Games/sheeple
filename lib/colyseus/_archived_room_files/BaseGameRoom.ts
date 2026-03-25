import { Room, Client } from "colyseus";
import { BaseGameState, Player } from "../schema/BaseGameState";

/**
 * BaseGameRoom provides common functionality for all games:
 * - Player management (join/leave/reconnect)
 * - Host migration
 * - Ready status tracking
 * - Chat system
 * - Base message handlers
 */
export abstract class BaseGameRoom extends Room {
  declare state: BaseGameState;
  maxClients = 8;

  // Reconnection window (5 minutes)
  private readonly RECONNECTION_WINDOW = 5 * 60 * 1000;

  onCreate(options: any): void {
    console.log(`[${this.constructor.name}] Room ${this.roomId} created`);

    // Register base message handlers
    this.onMessage("ready", this.handleReady.bind(this));
    this.onMessage("chat", this.handleChat.bind(this));
  }

  async onJoin(client: Client, options: any): Promise<void> {
    console.log(
      `[${this.constructor.name}] ${options.playerName} (${client.sessionId}) joining room ${this.roomId}`,
    );

    const { playerName, playerId, tabId } = options;

    // Check for duplicate tabs
    if (playerId && tabId) {
      const isDuplicate = this.checkDuplicateTab(playerId, tabId);
      if (isDuplicate) {
        throw new Error(
          "You are already connected to this game in another tab.",
        );
      }
    }

    // Check if player is reconnecting
    let existingPlayer: Player | undefined;
    this.state.players.forEach((p: Player) => {
      if (
        p.playerName === playerName &&
        (!playerId || !p.uniquePlayerId || p.uniquePlayerId === playerId)
      ) {
        existingPlayer = p;
      }
    });

    if (existingPlayer) {
      console.log(
        `[${this.constructor.name}] ${playerName} reconnecting (${existingPlayer.sessionId} -> ${client.sessionId})`,
      );

      // Update player data for reconnection
      const oldSessionId = existingPlayer.sessionId;
      existingPlayer.sessionId = client.sessionId;
      existingPlayer.isConnected = true;
      existingPlayer.lastSeen = Date.now();
      existingPlayer.tabId = tabId || "";

      // Move player to new session ID
      this.state.players.set(client.sessionId, existingPlayer);
      this.state.players.delete(oldSessionId);

      // Update host if this was the host
      if (this.state.hostId === oldSessionId) {
        this.state.hostId = client.sessionId;
      }

      this.broadcast("player_reconnected" as any, {
        oldSessionId,
        newSessionId: client.sessionId,
        playerName,
      });
    } else {
      // New player joining
      const player = new Player();
      player.sessionId = client.sessionId;
      player.playerName = playerName;
      player.uniquePlayerId = playerId || "";
      player.tabId = tabId || "";
      player.isConnected = true;
      player.isReady = false;
      player.isHost = this.state.players.size === 0; // First player is host
      player.score = 0;
      player.joinedAt = Date.now();
      player.lastSeen = Date.now();

      this.state.players.set(client.sessionId, player);

      // Set host if first player
      if (player.isHost) {
        this.state.hostId = client.sessionId;
        console.log(
          `[${this.constructor.name}] ${playerName} is now the host of room ${this.roomId}`,
        );
      }

      this.broadcast(
        "player_joined" as any,
        {
          sessionId: client.sessionId,
          playerName,
        },
        { except: client },
      );
    }
  }

  async onLeave(client: Client, code?: number): Promise<void> {
    const player = this.state.players.get(client.sessionId);

    if (!player) return;

    console.log(
      `[${this.constructor.name}] ${player.playerName} (${client.sessionId}) leaving room ${this.roomId}`,
    );

    player.isConnected = false;
    player.lastSeen = Date.now();

    // Allow reconnection
    try {
      await this.allowReconnection(client, this.RECONNECTION_WINDOW / 1000);
      console.log(
        `[${this.constructor.name}] ${player.playerName} can reconnect within ${this.RECONNECTION_WINDOW / 1000}s`,
      );
    } catch (e) {
      console.log(
        `[${this.constructor.name}] ${player.playerName} disconnected permanently`,
      );

      // Remove player permanently
      this.state.players.delete(client.sessionId);

      // Migrate host if needed
      const wasHost = this.state.hostId === client.sessionId;
      if (wasHost && this.state.players.size > 0) {
        this.migrateHost();
      }

      // Dispose room if empty
      if (this.state.players.size === 0) {
        console.log(
          `[${this.constructor.name}] Room ${this.roomId} is empty, disposing`,
        );
        this.disconnect();
      }
    }
  }

  onDispose(): void {
    console.log(`[${this.constructor.name}] Room ${this.roomId} disposed`);
  }

  // Helper Methods

  protected checkDuplicateTab(uniquePlayerId: string, tabId: string): boolean {
    let hasDuplicate = false;
    this.state.players.forEach((p: Player) => {
      if (
        p.uniquePlayerId === uniquePlayerId &&
        p.tabId !== tabId &&
        p.isConnected
      ) {
        hasDuplicate = true;
      }
    });
    return hasDuplicate;
  }

  protected migrateHost(): void {
    let newHostId: string | null = null;
    let newHost: any = null;

    this.state.players.forEach((p: Player, sessionId: string) => {
      if (p.isConnected && !newHostId) {
        newHostId = sessionId;
        newHost = p;
      }
    });

    if (!newHostId || !newHost) return;

    // Update old host
    const oldHost = this.state.players.get(this.state.hostId);
    if (oldHost) {
      oldHost.isHost = false;
    }

    // Set new host
    newHost.isHost = true;
    this.state.hostId = newHostId;

    console.log(
      `[${this.constructor.name}] Host migrated to ${newHost.playerName} (${newHostId})`,
    );

    this.broadcast("host_changed" as any, {
      newHostId,
      playerName: newHost.playerName,
    });
  }

  protected checkAllReady(): boolean {
    let allReady = true;
    let hasPlayers = false;

    this.state.players.forEach((p: Player) => {
      if (p.isConnected) {
        hasPlayers = true;
        if (!p.isReady) {
          allReady = false;
        }
      }
    });

    return hasPlayers && allReady;
  }

  protected isHost(client: Client): boolean {
    return this.state.hostId === client.sessionId;
  }

  protected getPlayerByName(name: string): Player | undefined {
    let found: Player | undefined;
    this.state.players.forEach((p: Player) => {
      if (p.playerName === name) {
        found = p;
      }
    });
    return found;
  }

  // Message Handlers

  private handleReady(client: Client, data?: { ready?: boolean }): void {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      client.send("error", { message: "Player not found" });
      return;
    }

    if (this.state.gameStarted) {
      client.send("error", { message: "Game already started" });
      return;
    }

    // Toggle ready state if not specified
    player.isReady = data?.ready !== undefined ? data.ready : !player.isReady;

    this.broadcast("player_ready_changed" as any, {
      sessionId: client.sessionId,
      playerName: player.playerName,
      isReady: player.isReady,
    });
  }

  private handleChat(client: Client, data: { message: string }): void {
    const player = this.state.players.get(client.sessionId);

    if (!player) return;

    if (!data.message || typeof data.message !== "string") {
      client.send("error", { message: "Invalid chat message" });
      return;
    }

    const message = data.message.trim();
    if (message.length === 0 || message.length > 500) {
      client.send("error", { message: "Message must be 1-500 characters" });
      return;
    }

    this.broadcast("chat_message" as any, {
      playerName: player.playerName,
      message,
      timestamp: Date.now(),
    });
  }
}
