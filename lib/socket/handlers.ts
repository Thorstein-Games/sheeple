import { Server as SocketIOServer, Socket } from "socket.io";
import { GameEvents } from "./events";
import { MIN_PLAYERS, MAX_PLAYERS } from "../constants";
import { GameManager } from "../game/GameManager";

let gameManager: GameManager;

export function setupSocketHandlers(io: SocketIOServer) {
  gameManager = new GameManager(io);

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle getting all rooms
    socket.on(GameEvents.GET_ROOMS, () => {
      handleGetRooms(io, socket);
    });

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

    // Handle next round request
    socket.on(GameEvents.NEXT_ROUND, () => {
      handleNextRound(io, socket);
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
function handleGetRooms(io: SocketIOServer, socket: Socket) {
  const rooms = gameManager.getAllRooms();
  socket.emit(GameEvents.ROOMS_LIST, { rooms });
}

function handleJoinGame(
  io: SocketIOServer,
  socket: Socket,
  data: { playerName: string; roomId?: string; isPrivate?: boolean }
) {
  const { playerName, roomId, isPrivate = false } = data;

  const room = roomId || generateRoomId();

  if (socket.data.roomId === room) {
    console.log(
      `Player ${socket.id} already in room ${room}, sending room state`
    );

    // Send current room state with all players
    const roomState = gameManager.getRoomState(room);
    if (roomState) {
      socket.emit(GameEvents.ROOM_STATE, {
        roomId: roomState.roomId,
        players: roomState.players.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          isReady: p.isReady,
        })),
        previousWinners: roomState.previousWinners,
      });
    }
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

  const added = gameManager.addPlayer(room, socket.id, playerName, isPrivate);

  if (!added) {
    console.log(
      `Player ${socket.id} already exists in game manager, sending room state`
    );

    // Send current room state
    const roomState = gameManager.getRoomState(room);
    if (roomState) {
      socket.emit(GameEvents.ROOM_STATE, {
        roomId: roomState.roomId,
        players: roomState.players.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          isReady: p.isReady,
        })),
        previousWinners: roomState.previousWinners,
      });
    }
    return;
  }

  // Notify OTHER players in room about new player
  socket.to(room).emit(GameEvents.PLAYER_JOINED, {
    playerId: socket.id,
    playerName,
    roomId: room,
  });

  // Send full room state to the joining player
  const roomState = gameManager.getRoomState(room);
  if (roomState) {
    socket.emit(GameEvents.ROOM_STATE, {
      roomId: roomState.roomId,
      players: roomState.players,
      previousWinners: roomState.previousWinners,
    });
  }

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

  // Check if all players are ready
  if (gameManager.areAllPlayersReady(room)) {
    gameManager.startGame(room);
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

  // Broadcast to all players in the room that this player submitted
  io.to(room).emit(GameEvents.ANSWER_SUBMITTED, {
    playerId: socket.id,
    playerName: socket.data.playerName,
  });
}

function handleNextRound(io: SocketIOServer, socket: Socket) {
  const room = socket.data.roomId;

  if (!room) {
    socket.emit(GameEvents.ERROR, { message: "Not in a room" });
    return;
  }

  // Start the next round
  const success = gameManager.startNextRound(room);

  if (!success) {
    socket.emit(GameEvents.ERROR, {
      message: "Cannot start next round at this time",
    });
  }
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
