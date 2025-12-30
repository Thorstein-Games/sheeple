import { Server as SocketIOServer, Socket } from "socket.io";
import { GameEvents } from "./events";
import { MIN_PLAYERS, MAX_PLAYERS } from "../constants";

export function setupSocketHandlers(io: SocketIOServer) {
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

// Handler functions
function handleJoinGame(
  io: SocketIOServer,
  socket: Socket,
  data: { playerName: string; roomId?: string }
) {
  const { playerName, roomId } = data;

  // If roomId provided, join that room, otherwise create a new one
  const room = roomId || generateRoomId();

  // Check if room is full
  const roomSockets = io.sockets.adapter.rooms.get(room);
  const currentPlayerCount = roomSockets ? roomSockets.size : 0;

  if (currentPlayerCount >= MAX_PLAYERS) {
    socket.emit(GameEvents.ERROR, {
      message: `Room is full! Maximum ${MAX_PLAYERS} players allowed.`,
    });
    return;
  }

  socket.join(room);
  socket.data.playerName = playerName;
  socket.data.roomId = room;

  // Notify room about new player
  io.to(room).emit(GameEvents.PLAYER_JOINED, {
    playerId: socket.id,
    playerName,
    roomId: room,
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
  const roomSockets = io.sockets.adapter.rooms.get(room);
  const currentPlayerCount = roomSockets ? roomSockets.size : 0;

  if (currentPlayerCount < MIN_PLAYERS) {
    socket.emit(GameEvents.ERROR, {
      message: `Need at least ${MIN_PLAYERS} players to start the game. Currently: ${currentPlayerCount}`,
    });
    return;
  }

  // Broadcast ready status to room
  io.to(room).emit(GameEvents.PLAYER_READY_STATUS, {
    playerId: socket.id,
    playerName: socket.data.playerName,
  });

  console.log(`${socket.data.playerName} is ready`);
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

  // Broadcast answer submission to room (without revealing the answer)
  io.to(room).emit(GameEvents.ANSWER_SUBMITTED, {
    playerId: socket.id,
    playerName: socket.data.playerName,
  });

  // Store answer in socket data (you might want to use a proper game state manager)
  socket.data.currentAnswer = data.answer;

  console.log(`${socket.data.playerName} submitted an answer`);
}

function handleDisconnect(io: SocketIOServer, socket: Socket) {
  const room = socket.data.roomId;
  const playerName = socket.data.playerName;

  if (room) {
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
