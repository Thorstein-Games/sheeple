import { Server as SocketIOServer, Socket } from "socket.io";
import { GameEvents } from "./events";
import { MIN_PLAYERS, MAX_PLAYERS } from "../constants";
import { GameManager } from "../game/GameManager";

let gameManager: GameManager;

export function setupSocketHandlers(io: SocketIOServer) {
  gameManager = new GameManager(io);

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle player joining
    socket.on(
      GameEvents.JOIN_GAME,
      (data: { playerName: string; roomId?: string }) => {
        handleJoinGame(io, socket, data);
      }
    );

    // Handle player ready
    socket.on(GameEvents.PLAYER_READY, () => {
      handlePlayerReady(io, socket);
    });

    // Handle answer submission
    socket.on(GameEvents.SUBMIT_ANSWER, (data: { answer: string }) => {
      handleSubmitAnswer(io, socket, data);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      handleDisconnect(io, socket);
    });
  });
}

export function getGameManager(): GameManager {
  return gameManager;
}

// Handler functions
function handleJoinGame(
  io: SocketIOServer,
  socket: Socket,
  data: { playerName: string; roomId?: string }
) {
  const { playerName, roomId } = data;

  // If roomId provided, join that room, otherwise create a new one
  const room = roomId || generateRoomId();

  // Check if this socket is already in a room
  if (socket.data.roomId === room) {
    console.log(
      `Player ${socket.id} already in room ${room}, sending room state`
    );

    // Send current room state with all players
    const existingPlayers = gameManager.getPlayers(room);
    socket.emit(GameEvents.ROOM_STATE, {
      roomId: room,
      players: existingPlayers.map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        isReady: p.isReady,
      })),
    });
    return;
  }

  // Check if room is full
  const currentPlayerCount = gameManager.getPlayerCount(room);

  if (currentPlayerCount >= MAX_PLAYERS) {
    socket.emit(GameEvents.ERROR, {
      message: `Room is full! Maximum ${MAX_PLAYERS} players allowed.`,
    });
    return;
  }

  socket.join(room);
  socket.data.playerName = playerName;
  socket.data.roomId = room;

  // Add player to game manager (returns false if already exists)
  const added = gameManager.addPlayer(room, socket.id, playerName);

  if (!added) {
    console.log(
      `Player ${socket.id} already exists in game manager, sending room state`
    );

    // Send current room state
    const existingPlayers = gameManager.getPlayers(room);
    socket.emit(GameEvents.ROOM_STATE, {
      roomId: room,
      players: existingPlayers.map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        isReady: p.isReady,
      })),
    });
    return;
  }

  // Notify OTHER players in room about new player
  socket.to(room).emit(GameEvents.PLAYER_JOINED, {
    playerId: socket.id,
    playerName,
    roomId: room,
  });

  // Send full room state to the joining player
  const allPlayers = gameManager.getPlayers(room);
  socket.emit(GameEvents.ROOM_STATE, {
    roomId: room,
    players: allPlayers,
  });

  console.log(
    `${playerName} joined room ${room} (${
      currentPlayerCount + 1
    }/${MAX_PLAYERS} players)`
  );
}

function handlePlayerReady(io: SocketIOServer, socket: Socket) {
  const room = socket.data.roomId;

  if (!room) {
    socket.emit(GameEvents.ERROR, { message: "Not in a room" });
    return;
  }

  // Check if minimum players requirement is met
  const currentPlayerCount = gameManager.getPlayerCount(room);

  if (currentPlayerCount < MIN_PLAYERS) {
    socket.emit(GameEvents.ERROR, {
      message: `Need at least ${MIN_PLAYERS} players to start the game. Currently: ${currentPlayerCount}`,
    });
    return;
  }

  // Mark player as ready
  gameManager.setPlayerReady(room, socket.id, true);

  // Broadcast ready status to room
  io.to(room).emit(GameEvents.PLAYER_READY_STATUS, {
    playerId: socket.id,
    playerName: socket.data.playerName,
  });

  console.log(`${socket.data.playerName} is ready`);

  // Check if all players are ready
  if (gameManager.areAllPlayersReady(room)) {
    console.log(`All players ready in room ${room}. Starting game...`);
    setTimeout(() => {
      gameManager.startGame(room);
    }, 1500);
  }
}

function handleSubmitAnswer(
  io: SocketIOServer,
  socket: Socket,
  data: { answer: string }
) {
  const room = socket.data.roomId;

  if (!room) {
    socket.emit(GameEvents.ERROR, { message: "Not in a room" });
    return;
  }

  // Submit answer to game manager
  const success = gameManager.submitAnswer(room, socket.id, data.answer);

  if (!success) {
    socket.emit(GameEvents.ERROR, { message: "Failed to submit answer" });
    return;
  }

  // Confirm submission to player
  socket.emit(GameEvents.ANSWER_SUBMITTED, {
    playerId: socket.id,
    playerName: socket.data.playerName,
  });

  console.log(`${socket.data.playerName} submitted an answer: ${data.answer}`);
}

function handleDisconnect(io: SocketIOServer, socket: Socket) {
  const room = socket.data.roomId;
  const playerName = socket.data.playerName;

  if (room) {
    // Remove player from game manager
    gameManager.removePlayer(room, socket.id);

    io.to(room).emit(GameEvents.PLAYER_LEFT, {
      playerId: socket.id,
      playerName,
    });
  }

  console.log(`Client disconnected: ${socket.id} (${playerName})`);
}

// Utility function to generate random room IDs
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
